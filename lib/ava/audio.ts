import { supabaseAdmin } from '@/lib/supabase';

// Audio library (meditation, sleep, daily motivation). Every feature works without audio:
// callers get null/[] when no track exists and fall back to text.

export type AudioKind = 'meditation' | 'sleep' | 'motivation';
export interface AudioTrack {
  id: string; kind: AudioKind; purpose: string | null; title: string;
  duration_seconds: number | null; audio_url: string | null; telegram_file_id: string | null; active: boolean;
}

/** "12:05" style, or '' when unknown. */
export function formatDuration(seconds: number | null | undefined): string {
  if (!seconds || seconds < 1) return '';
  const m = Math.floor(seconds / 60), s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Same pick for everyone on a given day, cycling through the list (like the daily affirmation). */
export function trackForDay<T extends { id: string }>(tracks: T[], date: Date = new Date()): T | null {
  if (!tracks.length) return null;
  const sorted = [...tracks].sort((a, b) => a.id.localeCompare(b.id));
  const day = Math.floor(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / 86400000);
  return sorted[day % sorted.length];
}

export function pickRandom<T>(tracks: T[], rnd: () => number = Math.random): T | null {
  return tracks.length ? tracks[Math.min(tracks.length - 1, Math.floor(rnd() * tracks.length))] : null;
}

/** The sendAudio request body. A cached Telegram file_id wins over the URL. */
export function buildSendAudioBody(chatId: number, t: Pick<AudioTrack, 'title' | 'duration_seconds' | 'audio_url' | 'telegram_file_id'>, caption?: string) {
  const audio = t.telegram_file_id || t.audio_url;
  if (!audio) return null;
  const body: Record<string, unknown> = { chat_id: chatId, audio, title: t.title.slice(0, 64), performer: 'Ava' };
  if (t.duration_seconds) body.duration = t.duration_seconds;
  if (caption) body.caption = caption.slice(0, 1000);
  return body;
}

export async function listTracks(kind: AudioKind, purpose?: string): Promise<AudioTrack[]> {
  let q = supabaseAdmin.from('audio_tracks').select('*').eq('kind', kind).eq('active', true);
  if (purpose) q = q.eq('purpose', purpose);
  const { data, error } = await q.order('created_at', { ascending: true });
  if (error) { console.error('listTracks failed:', error.message); return []; }
  return (data ?? []) as AudioTrack[];
}

export async function getTrack(id: string): Promise<AudioTrack | null> {
  const { data } = await supabaseAdmin.from('audio_tracks').select('*').eq('id', id).eq('active', true).maybeSingle();
  return (data as AudioTrack) ?? null;
}

/** Sends a track. True if Telegram accepted it; the file_id is cached for next time. */
export async function sendTrack(chatId: number, track: AudioTrack, caption?: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const body = buildSendAudioBody(chatId, track, caption);
  if (!token || !body) return false;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendAudio`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    const json: any = await res.json().catch(() => ({}));
    if (!res.ok || !json.ok) { console.error('sendAudio failed:', track.id, JSON.stringify(json).slice(0, 300)); return false; }
    const fileId = json.result?.audio?.file_id;
    if (fileId && !track.telegram_file_id) {
      const { error } = await supabaseAdmin.from('audio_tracks').update({ telegram_file_id: fileId }).eq('id', track.id);
      if (error) console.error('caching file_id failed:', error.message);
    }
    return true;
  } catch (e) {
    console.error('sendAudio error:', e instanceof Error ? e.message : e);
    return false;
  }
}

// ── /sleep and /motivation ────────────────────────────────────────────────

type SendFn = (chatId: number, text: string, markdown?: boolean) => Promise<void>;
type SendKbFn = (chatId: number, text: string, keyboard: any[][], markdown?: boolean) => Promise<void>;

export async function showSleepMenu(chatId: number, send: SendFn, sendKb: SendKbFn): Promise<void> {
  const tracks = await listTracks('sleep');
  if (!tracks.length) {
    await send(chatId, 'Sleep sounds and bedtime stories are coming soon 🌙 In the meantime, /meditate has a short wind-down session.');
    return;
  }
  const keyboard = tracks.map(t => [{ text: `🌙 ${t.title}${formatDuration(t.duration_seconds) ? ` · ${formatDuration(t.duration_seconds)}` : ''}`, callback_data: 'aud_' + t.id }]);
  await sendKb(chatId, '🌙 *Pick something to fall asleep to:*', keyboard, true);
}

export async function handleAudioCallback(chatId: number, data: string, send: SendFn): Promise<boolean> {
  if (!data.startsWith('aud_')) return false;
  const track = await getTrack(data.slice(4));
  if (!track) { await send(chatId, 'That one is no longer available. Try /sleep again 🌸'); return true; }
  if (!(await sendTrack(chatId, track))) await send(chatId, 'I could not send that audio just now. Please try again in a moment 🌸');
  return true;
}

export async function sendMotivation(chatId: number, send: SendFn, fallbackText: string): Promise<void> {
  const track = trackForDay(await listTracks('motivation'));
  if (track && (await sendTrack(chatId, track, 'Today’s motivation 🌸'))) return;
  await send(chatId, fallbackText, false);
}
