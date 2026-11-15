'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Markdown } from '@/components/site/Markdown';
import { countWords, type Faq } from '@/lib/admin/content-ai';
import { AiPanel, type AiResponse } from './AiPanel';
import { Btn, Counter, Field, FaqEditor, Notice, api, inputCls } from './ui';

interface ToolRow { id: string; language: string; slug: string; h1: string; category: string | null; codeWords: number; customised: boolean; customWords: number | null; updated_at: string | null }

interface Reviewer { name: string; credentials: string; date: string; url: string }
interface Form { title: string; description: string; intro: string; article: string; faqs: Faq[]; reviewer: Reviewer }
interface Loaded { id: string; language: string; slug: string; base: Form; customised: boolean }

const NO_REVIEWER: Reviewer = { name: '', credentials: '', date: '', url: '' };

function toForm(base: any, o: any | null): Form {
  const pick = (a: unknown, b: unknown) => (typeof a === 'string' && a.trim() ? a : (typeof b === 'string' ? b : ''));
  const faqs = (v: unknown): Faq[] | null => (Array.isArray(v) && v.length ? v.filter((f: any) => f?.q && f?.a) : null);
  const r = o?.reviewed_by ?? base.reviewedBy ?? null;
  return {
    title: pick(o?.title, base.title), description: pick(o?.description, base.description), intro: pick(o?.intro, base.intro),
    article: pick(o?.article, base.article), faqs: faqs(o?.faqs) ?? faqs(base.faqs) ?? [],
    reviewer: r ? { name: r.name ?? '', credentials: r.credentials ?? '', date: r.date ?? '', url: r.url ?? '' } : NO_REVIEWER,
  };
}

export function ToolsAdmin() {
  const [rows, setRows] = useState<ToolRow[] | null>(null);
  const [cur, setCur] = useState<Loaded | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [undo, setUndo] = useState<Form | null>(null);
  const [tab, setTab] = useState<'edit' | 'preview'>('edit');
  const [msg, setMsg] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try { setRows((await api<{ tools: ToolRow[] }>('/api/admin/tools')).tools); }
    catch (e) { setRows([]); setMsg({ tone: 'error', text: e instanceof Error ? e.message : 'Could not load tools' }); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const set = (patch: Partial<Form>) => setForm(f => (f ? { ...f, ...patch } : f));
  const words = useMemo(() => (form ? countWords(form.article) : 0), [form?.article]);

  async function open(r: ToolRow) {
    setMsg(null); setUndo(null); setTab('edit');
    try {
      const { base, override } = await api<{ base: any; override: any | null }>(`/api/admin/tools?id=${encodeURIComponent(r.id)}&language=${r.language}`);
      setCur({ id: r.id, language: r.language, slug: base.slug, base: toForm(base, null), customised: !!override });
      setForm(toForm(base, override));
    } catch (e) { setMsg({ tone: 'error', text: e instanceof Error ? e.message : 'Could not open tool' }); }
  }

  function applyAi(_mode: string, r: AiResponse) {
    if (!form) return;
    setUndo(form);
    const x = r.result;
    setForm({
      ...form,
      title: x.title || form.title, description: x.meta_description || form.description,
      intro: x.excerpt || form.intro, article: x.body, faqs: x.faqs.length ? x.faqs : form.faqs,
    });
  }

  async function save() {
    if (!form || !cur) return;
    const same = (a: string, b: string) => a.trim() === b.trim();
    // Only fields that differ from the code copy are stored, so code stays the source of truth for the rest.
    const rv = form.reviewer;
    setSaving(true); setMsg(null);
    try {
      await api('/api/admin/tools', {
        method: 'POST',
        body: JSON.stringify({
          tool_id: cur.id, language: cur.language,
          title: same(form.title, cur.base.title) ? null : form.title,
          description: same(form.description, cur.base.description) ? null : form.description,
          intro: same(form.intro, cur.base.intro) ? null : form.intro,
          article: same(form.article, cur.base.article) ? null : form.article,
          faqs: JSON.stringify(form.faqs) === JSON.stringify(cur.base.faqs) ? [] : form.faqs,
          reviewed_by: rv.name.trim() ? { name: rv.name.trim(), credentials: rv.credentials.trim(), date: rv.date.trim(), url: rv.url.trim() } : null,
        }),
      });
      setMsg({ tone: 'ok', text: 'Saved. The live page updates within moments.' });
      await load(); setCur({ ...cur, customised: true });
    } catch (e) { setMsg({ tone: 'error', text: e instanceof Error ? e.message : 'Save failed' }); }
    finally { setSaving(false); }
  }

  async function revert() {
    if (!cur || !confirm('Revert this page to the copy in code? Your edits will be removed.')) return;
    try {
      await api(`/api/admin/tools?id=${encodeURIComponent(cur.id)}&language=${cur.language}`, { method: 'DELETE' });
      setForm(cur.base); setUndo(null); setCur({ ...cur, customised: false });
      setMsg({ tone: 'ok', text: 'Reverted to the code copy.' }); load();
    } catch (e) { setMsg({ tone: 'error', text: e instanceof Error ? e.message : 'Revert failed' }); }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
      <aside className="max-h-[75vh] overflow-y-auto rounded-2xl border border-line bg-white">
        {rows === null && <p className="p-4 text-sm text-muted-ink">Loading…</p>}
        {rows?.map(r => {
          const active = cur?.id === r.id && cur.language === r.language;
          const w = r.customWords ?? r.codeWords;
          return (
            <button key={`${r.id}:${r.language}`} type="button" onClick={() => open(r)} className={`block w-full border-b border-line px-4 py-3 text-left last:border-b-0 hover:bg-wash ${active ? 'bg-wash' : ''}`}>
              <span className="block text-sm font-semibold text-ink">{r.h1}</span>
              <span className="mt-1 flex items-center gap-2 text-xs text-muted-ink">
                <span>{r.language.toUpperCase()}</span>
                <span className={w >= 1000 ? 'font-semibold text-emerald-700' : ''}>{w} words</span>
                {r.customised && <span className="rounded-full bg-sky-100 px-2 py-0.5 font-semibold text-sky-900">Edited</span>}
              </span>
            </button>
          );
        })}
      </aside>

      <div className="space-y-5">
        {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
        {!form && <Notice>Pick a tool to edit its page copy. Edits are saved in the database and override the copy in code; “Revert” removes them. The calculator itself is not affected.</Notice>}
        {form && cur && (
          <>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display text-xl font-bold text-ink">/{cur.slug}</h2>
              <span className="text-xs text-muted-ink">{cur.customised ? 'Showing your edited copy' : 'Showing the copy from code'}</span>
            </div>
            <AiPanel
              kind="tool" language={cur.language} modes={['rewrite']} defaultWords={1200}
              current={() => ({ title: form.title, body: form.article, meta_description: form.description, excerpt: form.intro, faqs: form.faqs })}
              onResult={applyAi}
            />
            {undo && <Btn onClick={() => { setForm(undo); setUndo(null); }}>Undo last AI change</Btn>}

            <Field label="Title" right={<Counter value={form.title.length} max={60} />}>
              <input className={inputCls} value={form.title} onChange={e => set({ title: e.target.value })} />
            </Field>
            <Field label="Meta description" right={<Counter value={form.description.length} max={155} />}>
              <textarea className={`${inputCls} min-h-[64px]`} value={form.description} onChange={e => set({ description: e.target.value })} />
            </Field>
            <Field label="Intro (above the calculator)">
              <textarea className={`${inputCls} min-h-[64px]`} value={form.intro} onChange={e => set({ intro: e.target.value })} />
            </Field>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-semibold text-ink">Article (Markdown) <span className="font-normal text-muted-ink">· {words} words</span></span>
                <span className="flex gap-1">
                  <Btn className="!px-3 !py-1" variant={tab === 'edit' ? 'primary' : 'ghost'} onClick={() => setTab('edit')}>Edit</Btn>
                  <Btn className="!px-3 !py-1" variant={tab === 'preview' ? 'primary' : 'ghost'} onClick={() => setTab('preview')}>Preview</Btn>
                </span>
              </div>
              {tab === 'edit'
                ? <textarea className={`${inputCls} min-h-[420px] font-mono`} value={form.article} onChange={e => set({ article: e.target.value })} spellCheck />
                : <div className="min-h-[420px] rounded-xl border border-line bg-white p-5"><Markdown>{form.article || '*Nothing to preview yet.*'}</Markdown></div>}
              <p className="mt-1 text-xs text-muted-ink">The page adds its own medical disclaimer under the article, so do not write one here.</p>
            </div>

            <div>
              <span className="mb-2 block text-sm font-semibold text-ink">FAQs <span className="font-normal text-muted-ink">(aim for 4 or more)</span></span>
              <FaqEditor value={form.faqs} onChange={faqs => set({ faqs })} />
            </div>

            <fieldset className="space-y-3 rounded-2xl border border-line bg-white p-4">
              <legend className="px-1 text-sm font-semibold text-ink">Medical reviewer (optional)</legend>
              <Notice tone="warn">Fill this in only for a real, named, licensed clinician who has actually reviewed this page. It is shown to readers and published in the page&apos;s structured data. Leave it empty otherwise.</Notice>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Name"><input className={inputCls} value={form.reviewer.name} onChange={e => set({ reviewer: { ...form.reviewer, name: e.target.value } })} /></Field>
                <Field label="Credentials"><input className={inputCls} value={form.reviewer.credentials} onChange={e => set({ reviewer: { ...form.reviewer, credentials: e.target.value } })} placeholder="e.g. MBBS, consultant obstetrician" /></Field>
                <Field label="Date reviewed"><input className={inputCls} type="date" value={form.reviewer.date} onChange={e => set({ reviewer: { ...form.reviewer, date: e.target.value } })} /></Field>
                <Field label="Profile link (optional)"><input className={inputCls} value={form.reviewer.url} onChange={e => set({ reviewer: { ...form.reviewer, url: e.target.value } })} placeholder="https://" /></Field>
              </div>
            </fieldset>

            <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-2 border-t border-line bg-paper/95 px-4 py-3 backdrop-blur">
              <Btn variant="primary" disabled={saving || !form.title || !form.article} onClick={save}>{saving ? 'Saving…' : 'Save to live page'}</Btn>
              {cur.customised && <Btn variant="danger" className="ml-auto" onClick={revert}>Revert to code copy</Btn>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
