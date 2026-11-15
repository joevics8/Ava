'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Markdown } from '@/components/site/Markdown';
import { TOOLS } from '@/lib/tools/registry';
import { countWords, readTimeMinutes, slugify, type Faq } from '@/lib/admin/content-ai';
import { AiPanel, type AiResponse } from './AiPanel';
import { Btn, Counter, Field, FaqEditor, Notice, api, inputCls } from './ui';

type State = 'hold' | 'queued' | 'published';

interface Row { slug: string; language: string; title: string; category: string | null; published: boolean; review_hold: boolean; published_at: string | null; updated_at: string | null }

interface Form {
  isNew: boolean; language: string; slug: string; title: string; excerpt: string; meta_description: string;
  content: string; category: string; read_time: number | null; faqs: Faq[]; related_tool_ids: string[]; state: State;
}

const EMPTY: Form = { isNew: true, language: 'en', slug: '', title: '', excerpt: '', meta_description: '', content: '', category: '', read_time: null, faqs: [], related_tool_ids: [], state: 'hold' };

const stateOf = (r: Pick<Row, 'published' | 'review_hold'>): State => (r.published ? 'published' : r.review_hold ? 'hold' : 'queued');
const STATE_LABEL: Record<State, string> = { hold: 'On hold', queued: 'Queued', published: 'Published' };
const STATE_CLS: Record<State, string> = { hold: 'bg-amber-100 text-amber-900', queued: 'bg-sky-100 text-sky-900', published: 'bg-emerald-100 text-emerald-900' };

export function BlogAdmin() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [undo, setUndo] = useState<Form | null>(null);
  const [tab, setTab] = useState<'edit' | 'preview'>('edit');
  const [msg, setMsg] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try { setRows((await api<{ posts: Row[] }>('/api/admin/blog')).posts); }
    catch (e) { setRows([]); setMsg({ tone: 'error', text: e instanceof Error ? e.message : 'Could not load posts' }); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const set = (patch: Partial<Form>) => setForm(f => (f ? { ...f, ...patch } : f));
  const words = useMemo(() => (form ? countWords(form.content) : 0), [form?.content]);

  async function open(r: Row) {
    setMsg(null); setUndo(null); setTab('edit');
    try {
      const { post } = await api<{ post: any }>(`/api/admin/blog?slug=${encodeURIComponent(r.slug)}&language=${r.language}`);
      setForm({
        isNew: false, language: post.language, slug: post.slug, title: post.title ?? '', excerpt: post.excerpt ?? '',
        meta_description: post.meta_description ?? '', content: post.content ?? '', category: post.category ?? '',
        read_time: post.read_time ?? null, faqs: Array.isArray(post.faqs) ? post.faqs : [], related_tool_ids: post.related_tool_ids ?? [],
        state: stateOf(post),
      });
    } catch (e) { setMsg({ tone: 'error', text: e instanceof Error ? e.message : 'Could not open post' }); }
  }

  function applyAi(mode: string, r: AiResponse) {
    if (!form) return;
    setUndo(form);
    const x = r.result;
    setForm({
      ...form,
      title: x.title || form.title,
      excerpt: x.excerpt || form.excerpt,
      meta_description: x.meta_description || form.meta_description,
      content: x.body,
      faqs: x.faqs.length ? x.faqs : form.faqs,
      // Keep a slug the author already settled on; only fill it for a brand-new post.
      slug: form.isNew && !form.slug ? x.slug : form.slug,
      category: x.category || form.category,
      related_tool_ids: x.related_tool_ids.length ? x.related_tool_ids : form.related_tool_ids,
      read_time: readTimeMinutes(r.words),
      // Anything AI wrote waits for a human before the cron can release it.
      state: form.state === 'published' ? 'published' : 'hold',
    });
  }

  async function save(state: State) {
    if (!form) return;
    if (state === 'published' && !confirm('Publish this post now? It goes live immediately.')) return;
    setSaving(true); setMsg(null);
    try {
      const slug = slugify(form.slug || form.title);
      await api('/api/admin/blog', {
        method: 'POST',
        body: JSON.stringify({
          slug, language: form.language, title: form.title, excerpt: form.excerpt || null, meta_description: form.meta_description || null,
          content: form.content, category: form.category || null, read_time: form.read_time ?? readTimeMinutes(words),
          faqs: form.faqs.filter(f => f.q.trim() && f.a.trim()), related_tool_ids: form.related_tool_ids, state,
        }),
      });
      setForm({ ...form, slug, isNew: false, state });
      setMsg({ tone: 'ok', text: state === 'published' ? 'Published.' : state === 'queued' ? 'Saved and queued for the daily release.' : 'Saved on hold. The cron will not release it.' });
      load();
    } catch (e) { setMsg({ tone: 'error', text: e instanceof Error ? e.message : 'Save failed' }); }
    finally { setSaving(false); }
  }

  async function remove() {
    if (!form || form.isNew || !confirm(`Delete “${form.title}” permanently?`)) return;
    try {
      await api(`/api/admin/blog?slug=${encodeURIComponent(form.slug)}&language=${form.language}`, { method: 'DELETE' });
      setForm(null); setMsg({ tone: 'ok', text: 'Deleted.' }); load();
    } catch (e) { setMsg({ tone: 'error', text: e instanceof Error ? e.message : 'Delete failed' }); }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <aside className="space-y-3">
        <Btn variant="primary" className="w-full" onClick={() => { setForm({ ...EMPTY }); setUndo(null); setMsg(null); setTab('edit'); }}>New post</Btn>
        <div className="max-h-[70vh] overflow-y-auto rounded-2xl border border-line bg-white">
          {rows === null && <p className="p-4 text-sm text-muted-ink">Loading…</p>}
          {rows?.length === 0 && <p className="p-4 text-sm text-muted-ink">No posts yet.</p>}
          {rows?.map(r => {
            const s = stateOf(r);
            const active = form && !form.isNew && form.slug === r.slug && form.language === r.language;
            return (
              <button key={`${r.language}:${r.slug}`} type="button" onClick={() => open(r)} className={`block w-full border-b border-line px-4 py-3 text-left last:border-b-0 hover:bg-wash ${active ? 'bg-wash' : ''}`}>
                <span className="block text-sm font-semibold text-ink">{r.title}</span>
                <span className="mt-1 flex items-center gap-2 text-xs text-muted-ink">
                  <span className={`rounded-full px-2 py-0.5 font-semibold ${STATE_CLS[s]}`}>{STATE_LABEL[s]}</span>
                  <span>{r.language.toUpperCase()}</span>{r.category && <span>· {r.category}</span>}
                </span>
              </button>
            );
          })}
        </div>
      </aside>

      <div className="space-y-5">
        {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
        {!form && <Notice>Pick a post, or start a new one. To clean an existing draft: New post, paste it into Content, add a title if you have one, then “Parse &amp; clean”.</Notice>}
        {form && (
          <>
            <AiPanel
              kind="blog" language={form.language} modes={['parse', 'rewrite', 'write']} defaultWords={1200}
              current={() => ({ title: form.title, body: form.content, meta_description: form.meta_description, excerpt: form.excerpt, faqs: form.faqs })}
              onResult={applyAi}
            />
            {undo && <Btn onClick={() => { setForm(undo); setUndo(null); }}>Undo last AI change</Btn>}

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Language">
                <select className={inputCls} value={form.language} disabled={!form.isNew} onChange={e => set({ language: e.target.value })}>
                  <option value="en">English</option><option value="es">Español</option>
                </select>
              </Field>
              <Field label="Slug" hint="Lowercase letters, numbers and hyphens.">
                <input className={inputCls} value={form.slug} disabled={!form.isNew} onChange={e => set({ slug: slugify(e.target.value) })} placeholder="auto from title" />
              </Field>
              <Field label="Category">
                <input className={inputCls} value={form.category} onChange={e => set({ category: slugify(e.target.value) })} placeholder="periods" />
              </Field>
            </div>

            <Field label="Title" right={<Counter value={form.title.length} max={70} />}>
              <input className={inputCls} value={form.title} onChange={e => set({ title: e.target.value })} />
            </Field>
            <Field label="Meta description" right={<Counter value={form.meta_description.length} max={155} />}>
              <textarea className={`${inputCls} min-h-[64px]`} value={form.meta_description} onChange={e => set({ meta_description: e.target.value })} />
            </Field>
            <Field label="Excerpt (blog index and teasers)" right={<Counter value={form.excerpt.length} max={200} />}>
              <textarea className={`${inputCls} min-h-[64px]`} value={form.excerpt} onChange={e => set({ excerpt: e.target.value })} />
            </Field>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-semibold text-ink">Content (Markdown) <span className="font-normal text-muted-ink">· {words} words · ~{readTimeMinutes(words)} min</span></span>
                <span className="flex gap-1">
                  <Btn className="!px-3 !py-1" variant={tab === 'edit' ? 'primary' : 'ghost'} onClick={() => setTab('edit')}>Edit</Btn>
                  <Btn className="!px-3 !py-1" variant={tab === 'preview' ? 'primary' : 'ghost'} onClick={() => setTab('preview')}>Preview</Btn>
                </span>
              </div>
              {tab === 'edit'
                ? <textarea className={`${inputCls} min-h-[420px] font-mono`} value={form.content} onChange={e => set({ content: e.target.value })} spellCheck />
                : <div className="min-h-[420px] rounded-xl border border-line bg-white p-5"><Markdown>{form.content || '*Nothing to preview yet.*'}</Markdown></div>}
            </div>

            <div>
              <span className="mb-2 block text-sm font-semibold text-ink">FAQs <span className="font-normal text-muted-ink">(shown under the article and in structured data)</span></span>
              <FaqEditor value={form.faqs} onChange={faqs => set({ faqs })} />
            </div>

            <fieldset>
              <legend className="mb-2 text-sm font-semibold text-ink">Related tools (internal links)</legend>
              <div className="grid gap-1 sm:grid-cols-2">
                {TOOLS.map(t => (
                  <label key={t.id} className="flex items-center gap-2 text-sm text-ink">
                    <input type="checkbox" checked={form.related_tool_ids.includes(t.id)}
                      onChange={e => set({ related_tool_ids: e.target.checked ? [...form.related_tool_ids, t.id] : form.related_tool_ids.filter(x => x !== t.id) })} />
                    {t.text.en?.h1 ?? t.id}
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-2 border-t border-line bg-paper/95 px-4 py-3 backdrop-blur">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATE_CLS[form.state]}`}>{STATE_LABEL[form.state]}</span>
              <Btn disabled={saving || !form.title || !form.content} onClick={() => save('hold')}>Save on hold</Btn>
              <Btn disabled={saving || !form.title || !form.content} onClick={() => save('queued')} title="Approved: the daily cron may release it">Approve &amp; queue</Btn>
              <Btn variant="amber" disabled={saving || !form.title || !form.content} onClick={() => save('published')}>Publish now</Btn>
              {!form.isNew && <Btn variant="danger" className="ml-auto" onClick={remove}>Delete</Btn>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
