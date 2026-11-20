import { supabaseAdmin } from '@/lib/supabase';
import { checkDraft, titleKey, type CheckInput } from './blog-checks';
import { notifySearchEngines } from '@/lib/search-ping';

// One cron does the whole job: check each held draft, release the ones that pass, then publish
// from the released drafts at the daily cap. Drafts that fail stay held with their reasons saved
// (shown in /admin/blog). A draft is checked once, and again only after someone edits it.

const DAILY_CAP = () => Number(process.env.BLOG_DAILY_CAP || 1);
const CHECK_BATCH = 10;
// Saving the check result touches updated_at a moment after auto_checked_at; only a later change counts as an edit.
const EDIT_GRACE_MS = 15_000;

export interface ApprovalSummary { checked: number; approved: number; held: { slug: string; reasons: string[] }[]; published: number; reason?: string }

type Row = CheckInput & { id: string; updated_at: string; auto_checked_at: string | null };

export async function runApproval(now = new Date()): Promise<ApprovalSummary> {
  const out: ApprovalSummary = { checked: 0, approved: 0, held: [], published: 0 };

  // Held drafts never checked, or edited since they were last checked.
  const { data: held, error } = await supabaseAdmin.from('blog_posts')
    .select('id,slug,language,title,excerpt,meta_description,content,faqs,updated_at,auto_checked_at')
    .eq('published', false).eq('review_hold', true).order('created_at', { ascending: true }).limit(60);
  if (error) throw new Error(error.message);
  const todo = ((held ?? []) as Row[]).filter(r => !r.auto_checked_at || new Date(r.updated_at).getTime() > new Date(r.auto_checked_at).getTime() + EDIT_GRACE_MS).slice(0, CHECK_BATCH);

  for (const d of todo) {
    const { data: others } = await supabaseAdmin.from('blog_posts').select('title').eq('language', d.language).neq('id', d.id);
    const result = checkDraft(d, { otherTitles: new Set((others ?? []).map((o: any) => titleKey(o.title))) });
    out.checked++;
    const stamp = new Date().toISOString();
    const { error: uErr } = await supabaseAdmin.from('blog_posts').update(
      result.ok
        ? { review_hold: false, auto_approved: true, auto_checked_at: stamp, auto_check_notes: null }
        : { auto_checked_at: stamp, auto_check_notes: result.reasons, auto_approved: false },
    ).eq('id', d.id);
    if (uErr) { console.error('approve update failed:', d.slug, uErr.message); continue; }
    if (result.ok) out.approved++; else out.held.push({ slug: d.slug, reasons: result.reasons });
  }

  // Drip out released drafts, oldest first, up to the daily cap.
  const dayStart = new Date(now); dayStart.setUTCHours(0, 0, 0, 0);
  const { count } = await supabaseAdmin.from('blog_posts').select('id', { count: 'exact', head: true }).eq('published', true).gte('published_at', dayStart.toISOString());
  const room = DAILY_CAP() - (count ?? 0);
  if (room <= 0) { out.reason = 'daily cap reached'; return out; }
  const { data: ready } = await supabaseAdmin.from('blog_posts').select('id,slug,language')
    .eq('published', false).eq('review_hold', false).order('created_at', { ascending: true }).limit(room);
  if (!ready?.length) { out.reason = out.reason ?? 'nothing ready to publish'; return out; }
  const { error: pErr } = await supabaseAdmin.from('blog_posts').update({ published: true, published_at: now.toISOString() }).in('id', ready.map(r => r.id));
  if (pErr) throw new Error(pErr.message);
  out.published = ready.length;
  try { await notifySearchEngines(ready); } catch (e) { console.error('search ping failed:', e instanceof Error ? e.message : e); }
  return out;
}
