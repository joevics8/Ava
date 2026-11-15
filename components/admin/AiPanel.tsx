'use client';
import { useState } from 'react';
import type { ContentResult, JobInput, JobKind, JobMode } from '@/lib/admin/content-ai';
import { Btn, Field, Notice, api, inputCls } from './ui';

export interface AiResponse { result: ContentResult; warnings: string[]; words: number; model: string }

const LABELS: Record<JobMode, string> = {
  parse: 'Parse & clean',
  rewrite: 'Rewrite for SEO',
  write: 'Write from brief',
};
const HELP: Record<JobMode, string> = {
  parse: 'Scissors only: strips AI/editor notes, keeps at most 5 good external links, fills slug, category, excerpt, meta description and FAQs. Wording is not changed.',
  rewrite: 'Retargets headings and copy at your keywords and expands to the word target, keeping the facts and safety advice that are already there.',
  write: 'Writes a first draft from your brief. It is saved on hold until you review it.',
};

/**
 * Shared AI controls. It only fetches a result and hands it to the parent, which
 * decides how to apply it (and offers Undo). Nothing is saved or published here.
 */
export function AiPanel({ kind, language, modes, defaultWords, current, onResult, disabled }: {
  kind: JobKind;
  language: string;
  modes: JobMode[];
  defaultWords?: number;
  /** The text currently in the editor, sent as the SOURCE. */
  current: () => Pick<JobInput, 'title' | 'body' | 'meta_description' | 'excerpt' | 'faqs'>;
  onResult: (mode: JobMode, r: AiResponse) => void;
  disabled?: boolean;
}) {
  const [keywords, setKeywords] = useState('');
  const [instructions, setInstructions] = useState('');
  const [topic, setTopic] = useState('');
  const [words, setWords] = useState(defaultWords ? String(defaultWords) : '');
  const [busy, setBusy] = useState<JobMode | null>(null);
  const [error, setError] = useState('');
  const [last, setLast] = useState<AiResponse | null>(null);

  async function run(mode: JobMode) {
    setBusy(mode); setError('');
    try {
      const target = Number(words);
      const res = await api<AiResponse>('/api/admin/ai', {
        method: 'POST',
        body: JSON.stringify({
          mode, kind, language,
          keywords: keywords || undefined,
          instructions: instructions || undefined,
          topic: mode === 'write' ? topic : undefined,
          targetWords: mode !== 'parse' && target >= 300 ? Math.round(target) : undefined,
          ...(mode === 'write' ? {} : current()),
        }),
      });
      setLast(res);
      onResult(mode, res);
    } catch (e) { setError(e instanceof Error ? e.message : 'Something went wrong'); }
    finally { setBusy(null); }
  }

  return (
    <section className="space-y-3 rounded-2xl border border-line bg-wash p-4" aria-label="AI writer">
      <h3 className="font-display text-base font-bold text-ink">AI writer</h3>
      {modes.includes('write') && (
        <Field label="Brief / topic" hint="For “Write from brief”: what the article should answer.">
          <textarea className={`${inputCls} min-h-[64px]`} value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. How long after stopping the pill does a period return?" />
        </Field>
      )}
      <div className="grid gap-3 sm:grid-cols-[1fr_110px]">
        <Field label="Keywords" hint="Comma-separated; the first is primary.">
          <input className={inputCls} value={keywords} onChange={e => setKeywords(e.target.value)} placeholder="period calculator, next period date" />
        </Field>
        <Field label="Words">
          <input className={inputCls} inputMode="numeric" value={words} onChange={e => setWords(e.target.value.replace(/\D/g, ''))} placeholder="1200" />
        </Field>
      </div>
      <Field label="Extra instructions (optional)">
        <input className={inputCls} value={instructions} onChange={e => setInstructions(e.target.value)} placeholder="e.g. mention Nigerian pharmacies; keep it under reading level 8" />
      </Field>
      <div className="flex flex-wrap gap-2">
        {modes.map(m => (
          <Btn key={m} variant={m === 'rewrite' ? 'primary' : 'ghost'} disabled={disabled || !!busy} onClick={() => run(m)} title={HELP[m]}>
            {busy === m ? 'Working…' : LABELS[m]}
          </Btn>
        ))}
      </div>
      {busy && <p className="text-xs text-muted-ink">This can take up to a minute for a long article.</p>}
      {error && <Notice tone="error">{error}</Notice>}
      {last && !error && (
        <Notice tone={last.warnings.length ? 'warn' : 'ok'}>
          <p className="font-semibold">Applied to the editor: {last.words} words ({last.model}). Review it, then save.</p>
          {last.warnings.length > 0 && <ul className="mt-2 list-disc space-y-1 pl-5">{last.warnings.map(w => <li key={w}>{w}</li>)}</ul>}
        </Notice>
      )}
    </section>
  );
}
