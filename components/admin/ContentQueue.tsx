'use client';
import { useCallback, useEffect, useState } from 'react';
import { ENABLED_LANGS } from '@/lib/site';
import { Btn, Notice, api, inputCls } from './ui';

interface Item {
  id: string; language: string; status: 'not_processed' | 'processed'; attempts: number; last_error: string | null;
  note: string | null; post_slug: string | null; created_at: string; processed_at: string | null; chars: number; preview: string;
}
interface Listing { pending: Item[]; processed: Item[]; maxAttempts: number }

const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '');
const MIN = 100;

/** Saved raw articles. The hourly cron parses the oldest one into a held draft. */
export function ContentQueue({ defaultLanguage = 'en', onPaste, onProcessed }: {
  defaultLanguage?: string;
  onPaste: (content: string, language: string) => void;
  onProcessed?: () => void;
}) {
  const [data, setData] = useState<Listing | null>(null);
  const [text, setText] = useState('');
  const [language, setLanguage] = useState(defaultLanguage);
  const [busy, setBusy] = useState<string | null>(null);
  const [showDone, setShowDone] = useState(false);
  const [msg, setMsg] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  const load = useCallback(async () => {
    try { setData(await api<Listing>('/api/admin/blog-queue')); }
    catch (e) { setMsg({ tone: 'error', text: e instanceof Error ? e.message : 'Could not load the queue' }); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key); setMsg(null);
    try { await fn(); } catch (e) { setMsg({ tone: 'error', text: e instanceof Error ? e.message : 'Failed' }); }
    finally { setBusy(null); }
  };

  const save = () => run('save', async () => {
    await api('/api/admin/blog-queue', { method: 'POST', body: JSON.stringify({ content: text, language }) });
    setText(''); setMsg({ tone: 'ok', text: 'Saved. The hourly job will turn it into a draft.' }); await load();
  });
  const paste = (it: Item) => run(`paste:${it.id}`, async () => {
    const { item } = await api<{ item: { content: string; language: string } }>(`/api/admin/blog-queue?id=${it.id}`);
    onPaste(item.content, item.language);
  });
  const del = (it: Item) => {
    if (!confirm('Delete this saved content?')) return;
    return run(`del:${it.id}`, async () => { await api(`/api/admin/blog-queue?id=${it.id}`, { method: 'DELETE' }); await load(); });
  };
  const retry = (it: Item) => run(`retry:${it.id}`, async () => { await api('/api/admin/blog-queue', { method: 'POST', body: JSON.stringify({ retry: it.id }) }); await load(); });
  const processNow = () => run('process', async () => {
    const r = await api<{ saved: { title: string }[]; failed: { error: string }[]; skipped: number }>('/api/admin/blog-queue', { method: 'POST', body: JSON.stringify({ process: true }) });
    if (r.saved.length) { setMsg({ tone: 'ok', text: `Draft saved on hold: “${r.saved[0].title}”.` }); onProcessed?.(); }
    else if (r.failed.length) setMsg({ tone: 'error', text: `Parse failed: ${r.failed[0].error}` });
    else setMsg({ tone: 'ok', text: 'Nothing waiting to process.' });
    await load();
  });

  const pending = data?.pending ?? [];
  const failed = (it: Item) => !!data && it.attempts >= data.maxAttempts;

  return (
    <section className="space-y-3 rounded-2xl border border-line bg-wash p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold text-ink">Saved content <span className="font-normal text-muted-ink">· {pending.length} waiting</span></h2>
        <span className="text-xs text-muted-ink">Oldest is parsed first, hourly</span>
      </div>

      <textarea className={`${inputCls} min-h-[110px] font-mono`} value={text} onChange={e => setText(e.target.value)}
        placeholder="Paste raw content here to save it for the hourly parser…" spellCheck={false} />
      <div className="flex flex-wrap items-center gap-2">
        <select className={`${inputCls} !w-auto`} value={language} onChange={e => setLanguage(e.target.value)} aria-label="Language">
          {ENABLED_LANGS.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <Btn variant="primary" disabled={busy !== null || text.trim().length < MIN} onClick={save}>{busy === 'save' ? 'Saving…' : 'Save to queue'}</Btn>
        <span className="text-xs text-muted-ink">{text.trim().length < MIN ? `${MIN}+ characters` : `${text.length.toLocaleString()} characters`}</span>
        <Btn className="ml-auto" disabled={busy !== null || pending.length === 0} onClick={processNow}>{busy === 'process' ? 'Parsing…' : 'Process oldest now'}</Btn>
      </div>

      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}

      {data === null && <p className="text-sm text-muted-ink">Loading…</p>}
      {data && pending.length === 0 && <p className="text-sm text-muted-ink">Nothing saved yet.</p>}
      <ul className="space-y-2">
        {pending.map(it => (
          <li key={it.id} className="rounded-xl border border-line bg-white p-3">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-ink">
              <span className={`rounded-full px-2 py-0.5 font-semibold ${failed(it) ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-900'}`}>
                {failed(it) ? 'Failed' : 'Not processed'}
              </span>
              <span>{when(it.created_at)}</span><span>· {it.language}</span><span>· ~{Math.round(it.chars / 6).toLocaleString()} words</span>
              {it.attempts > 0 && <span>· tried {it.attempts}×</span>}
            </div>
            <p className="mt-1 line-clamp-2 break-words text-sm text-ink">{it.preview}</p>
            {it.last_error && <p className="mt-1 text-xs text-red-700">{it.last_error}</p>}
            <div className="mt-2 flex gap-2">
              <Btn className="!px-3 !py-1" disabled={busy !== null} onClick={() => paste(it)}>{busy === `paste:${it.id}` ? '…' : 'Paste'}</Btn>
              {failed(it) && <Btn className="!px-3 !py-1" disabled={busy !== null} onClick={() => retry(it)}>Retry</Btn>}
              <Btn className="!px-3 !py-1" variant="danger" disabled={busy !== null} onClick={() => del(it)}>Delete</Btn>
            </div>
          </li>
        ))}
      </ul>

      {data && data.processed.length > 0 && (
        <div>
          <button type="button" className="text-xs font-semibold text-primary hover:underline" onClick={() => setShowDone(v => !v)}>
            {showDone ? 'Hide' : 'Show'} recently processed ({data.processed.length})
          </button>
          {showDone && (
            <ul className="mt-2 space-y-1 text-xs text-muted-ink">
              {data.processed.map(it => (
                <li key={it.id} className="flex flex-wrap items-center gap-2 rounded-lg bg-white px-3 py-2">
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-900">Processed</span>
                  <span>{when(it.processed_at)}</span>
                  <span className="text-ink">→ {it.post_slug}</span>
                  {it.note && <span className="w-full">{it.note}</span>}
                  <Btn className="ml-auto !px-3 !py-1" variant="danger" disabled={busy !== null} onClick={() => del(it)}>Delete</Btn>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
