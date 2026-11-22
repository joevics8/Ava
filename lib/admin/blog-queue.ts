import { supabaseAdmin } from '@/lib/supabase';
import { logged } from '@/lib/supabase-util';
import { readTimeMinutes, slugify, type Finished, type JobInput } from './content-ai';
import { runJob } from './run';

// The hourly cron turns raw saved articles into blog drafts. It runs the SAME
// parser as the "Parse & clean" button (runJob in parse mode) and saves the
// result as a HELD draft (published=false, review_hold=true), so the publish
// cron never releases it until a human approves it in /admin/blog.

export const MAX_ATTEMPTS = 3;
export const QUEUE_MAX_CHARS = 60000; // a parse returns the whole article, which must fit the model's output budget

export interface QueueItem { id: string; content: string; language: string; attempts: number }
export interface DraftRow {
  slug: string; language: string; title: string; excerpt: string | null; meta_description: string | null;
  content: string; category: string | null; read_time: number; faqs: { q: string; a: string }[];
  related_tool_ids: string[]; published: false; review_hold: true; published_at: null;
}

/** Everything the processor needs from the database, so tests can swap in a fake. */
export interface QueueStore {
  pending(limit: number): Promise<QueueItem[]>;
  /** Atomically takes the row (bumps attempts). False if another run already took it. */
  claim(item: QueueItem): Promise<boolean>;
  takenSlugs(language: string, root: string): Promise<Set<string>>;
  insertDraft(row: DraftRow): Promise<{ error?: { code?: string; message: string } }>;
  markProcessed(id: string, slug: string, note: string | null): Promise<void>;
  markFailed(id: string, message: string): Promise<void>;
}

/** A slug that does not collide with an existing post: base, base-2, base-3... Never overwrites. */
export function uniqueSlug(base: string, taken: ReadonlySet<string>): string {
  const root = slugify(base) || 'post';
  if (!taken.has(root)) return root;
  for (let n = 2; n < 1000; n++) {
    const suffix = `-${n}`;
    const candidate = root.slice(0, 80 - suffix.length).replace(/-+$/, '') + suffix;
    if (!taken.has(candidate)) return candidate;
  }
  return `${root.slice(0, 60)}-${Date.now()}`;
}

export interface ProcessSummary {
  saved: { id: string; slug: string; title: string }[];
  failed: { id: string; error: string }[];
  skipped: number;
}

export async function processQueue(
  deps: { store: QueueStore; parse?: (i: JobInput) => Promise<Finished> },
  opts: { limit: number; budgetMs: number; now?: () => number },
): Promise<ProcessSummary> {
  const { store } = deps;
  const parse = deps.parse ?? runJob;
  const now = opts.now ?? Date.now;
  const started = now();
  const out: ProcessSummary = { saved: [], failed: [], skipped: 0 };

  const items = await store.pending(opts.limit);
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    // The first article always runs. Do not START another once the time budget is nearly used up.
    if (i > 0 && now() - started > opts.budgetMs) break;
    if (!(await store.claim(item))) { out.skipped++; continue; }

    try {
      const { result, warnings, words } = await parse({ mode: 'parse', kind: 'blog', language: item.language, body: item.content });
      const title = result.title.trim();
      if (!title) throw new Error('The parser returned no title.');
      if (!result.body.trim()) throw new Error('The parser returned an empty article.');

      const root = slugify(result.slug || title) || 'post';
      const taken = await store.takenSlugs(item.language, root);
      const build = (slug: string): DraftRow => ({
        slug, language: item.language, title,
        excerpt: result.excerpt || null, meta_description: result.meta_description || null,
        content: result.body, category: result.category || null,
        read_time: readTimeMinutes(words),
        faqs: result.faqs, related_tool_ids: result.related_tool_ids,
        published: false, review_hold: true, published_at: null,
      });

      let slug = uniqueSlug(root, taken);
      let res = await store.insertDraft(build(slug));
      if (res.error?.code === '23505') { // lost a race for the slug: take the next free one, once
        slug = uniqueSlug(root, new Set([...Array.from(taken), slug]));
        res = await store.insertDraft(build(slug));
      }
      if (res.error) throw new Error(res.error.message);

      const note = warnings.length ? warnings.join(' · ').slice(0, 500) : null;
      await store.markProcessed(item.id, slug, note);
      out.saved.push({ id: item.id, slug, title });
    } catch (e) {
      const message = (e instanceof Error ? e.message : String(e)).slice(0, 500);
      await store.markFailed(item.id, message).catch(() => {});
      out.failed.push({ id: item.id, error: message });
    }
  }
  return out;
}

export const supabaseStore: QueueStore = {
  async pending(limit) {
    const { data, error } = await supabaseAdmin.from('blog_queue').select('id,content,language,attempts')
      .eq('status', 'not_processed').lt('attempts', MAX_ATTEMPTS).order('created_at', { ascending: true }).limit(limit);
    if (error) throw new Error(error.message);
    return (data ?? []) as QueueItem[];
  },
  async claim(item) {
    // Only succeeds if nobody changed attempts since we read the row.
    const { data, error } = await supabaseAdmin.from('blog_queue').update({ attempts: item.attempts + 1, last_error: null })
      .eq('id', item.id).eq('status', 'not_processed').eq('attempts', item.attempts).select('id');
    if (error) throw new Error(error.message);
    return (data?.length ?? 0) > 0;
  },
  async takenSlugs(language, root) {
    const { data, error } = await supabaseAdmin.from('blog_posts').select('slug').eq('language', language).like('slug', `${root}%`);
    if (error) throw new Error(error.message);
    return new Set((data ?? []).map(r => r.slug as string));
  },
  async insertDraft(row) {
    const { error } = await supabaseAdmin.from('blog_posts').insert(row);
    return error ? { error: { code: error.code, message: error.message } } : {};
  },
  async markProcessed(id, slug, note) {
    const { error } = await supabaseAdmin.from('blog_queue')
      .update({ status: 'processed', post_slug: slug, note, last_error: null, processed_at: new Date().toISOString() }).eq('id', id);
    if (error) throw new Error(error.message);
  },
  async markFailed(id, message) {
    await logged('blog_queue write', supabaseAdmin.from('blog_queue').update({ last_error: message }).eq('id', id));
  },
};

export async function countPending(): Promise<number> {
  const { count } = await supabaseAdmin.from('blog_queue').select('id', { count: 'exact', head: true })
    .eq('status', 'not_processed').lt('attempts', MAX_ATTEMPTS);
  return count ?? 0;
}
