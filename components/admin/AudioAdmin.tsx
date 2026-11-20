'use client';
import { useCallback, useEffect, useState } from 'react';
import { api, Btn, Field, inputCls, Notice } from './ui';

interface Track { id: string; kind: string; purpose: string | null; title: string; duration_seconds: number | null; audio_url: string | null; active: boolean }
const PURPOSES = ['morning', 'stress', 'overthinking', 'sleep', 'emotional_reset'];

export function AudioAdmin() {
  const [tracks, setTracks] = useState<Track[] | null>(null);
  const [msg, setMsg] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const [kind, setKind] = useState('sleep');
  const [purpose, setPurpose] = useState('morning');
  const [title, setTitle] = useState('');
  const [minutes, setMinutes] = useState('');
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try { setTracks((await api<{ tracks: Track[] }>('/api/admin/audio')).tracks); }
    catch (e) { setMsg({ tone: 'error', text: e instanceof Error ? e.message : 'Could not load' }); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg(null);
    try {
      await api('/api/admin/audio', { method: 'POST', body: JSON.stringify({
        kind, purpose: kind === 'meditation' ? purpose : '', title, audio_url: url,
        duration_seconds: minutes ? Math.round(Number(minutes) * 60) : null,
      }) });
      setTitle(''); setUrl(''); setMinutes(''); setMsg({ tone: 'ok', text: 'Track added.' }); load();
    } catch (err) { setMsg({ tone: 'error', text: err instanceof Error ? err.message : 'Failed' }); }
    setBusy(false);
  }
  async function toggle(t: Track) { await api('/api/admin/audio', { method: 'PATCH', body: JSON.stringify({ id: t.id, active: !t.active }) }); load(); }
  async function remove(t: Track) {
    if (!confirm(`Delete "${t.title}"?`)) return;
    await api(`/api/admin/audio?id=${t.id}`, { method: 'DELETE' }); load();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <form onSubmit={add} className="space-y-4 rounded-xl border border-line bg-white p-4">
        <Field label="Type">
          <select className={inputCls} value={kind} onChange={e => setKind(e.target.value)}>
            <option value="sleep">Sleep (/sleep)</option>
            <option value="motivation">Daily motivation (/motivation and the daily push)</option>
            <option value="meditation">Meditation (/meditate)</option>
          </select>
        </Field>
        {kind === 'meditation' && (
          <Field label="Meditation purpose">
            <select className={inputCls} value={purpose} onChange={e => setPurpose(e.target.value)}>{PURPOSES.map(p => <option key={p}>{p}</option>)}</select>
          </Field>
        )}
        <Field label="Title" hint="Shown in the Telegram player (max 64 characters)"><input required className={inputCls} value={title} onChange={e => setTitle(e.target.value)} maxLength={64} /></Field>
        <Field label="Length in minutes" hint="Optional"><input className={inputCls} inputMode="decimal" value={minutes} onChange={e => setMinutes(e.target.value)} /></Field>
        <Field label="Public audio URL" hint="https://… link to an mp3 or m4a, up to 20 MB"><input required className={inputCls} value={url} onChange={e => setUrl(e.target.value)} placeholder="https://…supabase.co/storage/v1/object/public/audio/…" /></Field>
        <Btn variant="primary" disabled={busy}>{busy ? 'Adding…' : 'Add track'}</Btn>
        {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
      </form>

      <div className="rounded-xl border border-line bg-white">
        {tracks === null && <p className="p-4 text-sm text-muted-ink">Loading…</p>}
        {tracks?.length === 0 && <p className="p-4 text-sm text-muted-ink">No tracks yet. The bot is using text for everything.</p>}
        {tracks?.map(t => (
          <div key={t.id} className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3 last:border-b-0">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{t.title}</p>
              <p className="text-xs text-muted-ink">{t.kind}{t.purpose ? ` · ${t.purpose}` : ''}{t.duration_seconds ? ` · ${Math.round(t.duration_seconds / 60)} min` : ''}{t.active ? '' : ' · off'}</p>
            </div>
            <Btn onClick={() => toggle(t)}>{t.active ? 'Turn off' : 'Turn on'}</Btn>
            <Btn onClick={() => remove(t)}>Delete</Btn>
          </div>
        ))}
      </div>
    </div>
  );
}
