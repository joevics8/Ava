import { describe, it, expect } from 'vitest';
import { processQueue, uniqueSlug, MAX_ATTEMPTS, type QueueStore, type QueueItem, type DraftRow } from '../blog-queue';
import type { Finished } from '../content-ai';

const fin = (over: Partial<Finished['result']> = {}, warnings: string[] = [], words = 600): Finished => ({
  result: { title: 'Cycle Basics', slug: 'cycle-basics', excerpt: 'e', meta_description: 'm', body: 'Body text', category: 'Health', faqs: [], related_tool_ids: [], ...over } as Finished['result'],
  warnings, words,
});

function fake(items: QueueItem[], taken: string[] = []) {
  const s = {
    items: [...items], taken: new Set(taken), inserted: [] as DraftRow[], processed: [] as { id: string; slug: string; note: string | null }[],
    failed: [] as { id: string; message: string }[], claims: [] as string[], loseClaim: new Set<string>(), insertErrors: [] as { code?: string; message: string }[],
  };
  const store: QueueStore = {
    async pending(limit) { return s.items.slice(0, limit); },
    async claim(i) { s.claims.push(i.id); return !s.loseClaim.has(i.id); },
    async takenSlugs() { return s.taken; },
    async insertDraft(row) { const e = s.insertErrors.shift(); if (e) return { error: e }; s.inserted.push(row); s.taken.add(row.slug); return {}; },
    async markProcessed(id, slug, note) { s.processed.push({ id, slug, note }); },
    async markFailed(id, message) { s.failed.push({ id, message }); },
  };
  return { s, store };
}
const item = (id: string): QueueItem => ({ id, content: `raw ${id}`, language: 'en', attempts: 0 });

describe('uniqueSlug', () => {
  it('keeps a free slug, suffixes a taken one, never overwrites', () => {
    expect(uniqueSlug('Cycle Basics', new Set())).toBe('cycle-basics');
    expect(uniqueSlug('cycle-basics', new Set(['cycle-basics']))).toBe('cycle-basics-2');
    expect(uniqueSlug('cycle-basics', new Set(['cycle-basics', 'cycle-basics-2']))).toBe('cycle-basics-3');
  });
  it('stays within 80 chars', () => {
    const long = 'a'.repeat(120);
    const base = uniqueSlug(long, new Set());
    expect(uniqueSlug(long, new Set([base])).length).toBeLessThanOrEqual(80);
  });
});

describe('processQueue', () => {
  it('saves a HELD draft, marks processed and passes warnings as the note', async () => {
    const { s, store } = fake([item('a')]);
    const out = await processQueue({ store, parse: async () => fin({}, ['check claim'], 1200) }, { limit: 3, budgetMs: 1000 });
    expect(out.saved).toHaveLength(1);
    expect(s.inserted[0]).toMatchObject({ slug: 'cycle-basics', published: false, review_hold: true, published_at: null, language: 'en' });
    expect(s.processed[0]).toEqual({ id: 'a', slug: 'cycle-basics', note: 'check claim' });
  });

  it('parses in scissors mode as a blog with the saved language', async () => {
    const { store } = fake([{ ...item('a'), language: 'es' }]);
    let seen: any;
    await processQueue({ store, parse: async i => { seen = i; return fin(); } }, { limit: 1, budgetMs: 1000 });
    expect(seen).toMatchObject({ mode: 'parse', kind: 'blog', language: 'es', body: 'raw a' });
  });

  it('processes in the order the store returns (oldest first) and respects the limit', async () => {
    const { s, store } = fake([item('old'), item('mid'), item('new')]);
    const order: string[] = [];
    await processQueue({ store, parse: async i => { order.push(i.body!); return fin({ title: `T${order.length}`, slug: `t${order.length}` }); } }, { limit: 2, budgetMs: 1000 });
    expect(order).toEqual(['raw old', 'raw mid']);
    expect(s.claims).toEqual(['old', 'mid']);
  });

  it('skips an item another run already claimed', async () => {
    const { s, store } = fake([item('a'), item('b')]);
    s.loseClaim.add('a');
    const out = await processQueue({ store, parse: async () => fin() }, { limit: 3, budgetMs: 1000 });
    expect(out.skipped).toBe(1);
    expect(out.saved.map(x => x.id)).toEqual(['b']);
  });

  it('never overwrites an existing post: takes the next free slug', async () => {
    const { s, store } = fake([item('a')], ['cycle-basics']);
    await processQueue({ store, parse: async () => fin() }, { limit: 1, budgetMs: 1000 });
    expect(s.inserted[0].slug).toBe('cycle-basics-2');
  });

  it('retries once on a unique-violation race', async () => {
    const { s, store } = fake([item('a')]);
    s.insertErrors.push({ code: '23505', message: 'duplicate' });
    const out = await processQueue({ store, parse: async () => fin() }, { limit: 1, budgetMs: 1000 });
    expect(out.saved).toHaveLength(1);
    expect(s.inserted[0].slug).toBe('cycle-basics-2');
  });

  it('a failed parse leaves the item unprocessed with the error, and the next item still runs', async () => {
    const { s, store } = fake([item('a'), item('b')]);
    let n = 0;
    const out = await processQueue({ store, parse: async () => { if (n++ === 0) throw new Error('Gemini down'); return fin(); } }, { limit: 3, budgetMs: 1000 });
    expect(s.failed).toEqual([{ id: 'a', message: 'Gemini down' }]);
    expect(s.processed.map(p => p.id)).toEqual(['b']);
    expect(out.failed).toHaveLength(1);
  });

  it('rejects an empty title or body instead of saving a blank draft', async () => {
    const { s, store } = fake([item('a'), item('b')]);
    const out = await processQueue({ store, parse: async i => (i.body === 'raw a' ? fin({ title: ' ' }) : fin({ body: '  ' })) }, { limit: 3, budgetMs: 1000 });
    expect(s.inserted).toHaveLength(0);
    expect(out.failed).toHaveLength(2);
  });

  it('does not start another article once the time budget is spent, but always runs the first', async () => {
    const { s, store } = fake([item('a'), item('b')]);
    let t = 0;
    await processQueue({ store, parse: async () => { t += 5000; return fin(); }, }, { limit: 3, budgetMs: 1000, now: () => t });
    expect(s.processed.map(p => p.id)).toEqual(['a']);
  });

  it('exposes the attempt cap', () => { expect(MAX_ATTEMPTS).toBe(3); });
});
