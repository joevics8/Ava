import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { FakeDb } from './helpers/fake-supabase';

// End-to-end bot conversations: a real Telegram update goes into the real webhook handler; only the database,
// Telegram and Gemini are stand-ins. These cover the flows that have broken in production before.

const hoisted = vi.hoisted(() => ({ db: null as any, pending: [] as Promise<unknown>[] }));
vi.mock('@/lib/supabase', () => ({ get supabaseAdmin() { return hoisted.db; }, get supabase() { return hoisted.db; } }));
vi.mock('@vercel/functions', () => ({ waitUntil: (p: Promise<unknown>) => { hoisted.pending.push(p); } }));

let db: FakeDb;
let sent: { method: string; body: any }[] = [];
let geminiCalls = 0;
const sentTexts = () => sent.filter(s => s.method === 'sendMessage').map(s => String(s.body.text));

const USER = { id: 'u1', telegram_id: 111, name: 'Ada', onboarding_complete: true, onboarding_step: 0, plan: 'free', country: 'Nigeria', timezone: 'Africa/Lagos', mode: 'cycle', last_seen_at: new Date().toISOString() };

beforeEach(() => {
  process.env.TELEGRAM_WEBHOOK_SECRET = 's'; process.env.TELEGRAM_BOT_TOKEN = 't'; process.env.GEMINI_API_KEY = 'g'; process.env.SUPABASE_SERVICE_ROLE_KEY = 'k';
  db = new FakeDb(); hoisted.db = db; hoisted.pending.length = 0; sent = []; geminiCalls = 0;
  db.seed('users', [{ ...USER }]);
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: any) => {
    const u = String(url);
    const tg = u.match(/api\.telegram\.org\/bot[^/]+\/(\w+)/);
    if (tg) { sent.push({ method: tg[1], body: JSON.parse(init?.body ?? '{}') }); return new Response(JSON.stringify({ ok: true, result: { message_id: 1 } }), { status: 200 }); }
    if (u.includes('generativelanguage')) { geminiCalls++; return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: 'GENERAL' }] } }], embedding: { values: [] } }), { status: 200 }); }
    return new Response('{}', { status: 200 });
  }));
});

async function post(update: any, secret = 's') {
  const { POST } = await import('@/app/api/webhook/route');
  const res = await POST(new NextRequest('http://localhost/api/webhook', { method: 'POST', headers: { 'content-type': 'application/json', 'x-telegram-bot-api-secret-token': secret }, body: JSON.stringify(update) }));
  await Promise.all(hoisted.pending);
  return res;
}
const say = (text: string, from = 111) => ({ update_id: 1, message: { message_id: 1, from: { id: from, first_name: 'Ada' }, chat: { id: from }, text } });
const tap = (data: string, from = 111) => ({ update_id: 2, callback_query: { id: 'cb1', data, from: { id: from }, message: { chat: { id: from }, message_id: 5 } } });

describe('webhook security', () => {
  it('ignores requests without the secret', async () => {
    await post(say('hello'), 'wrong');
    expect(sent).toHaveLength(0);
  });
});

describe('safety', () => {
  it('answers self-harm messages with care and a way to reach a person, with no AI call and no remedies', async () => {
    await post(say('I want to kill myself'));
    const texts = sentTexts();
    expect(texts).toHaveLength(1);
    expect(texts[0]).toMatch(/112/);
    expect(texts[0]).toMatch(/real person/);
    expect(texts[0].toLowerCase()).not.toMatch(/remed|meditat/);
    expect(geminiCalls).toBe(0);
  });
});

describe('/timezone', () => {
  it('sets her zone from a country or city', async () => {
    await post(say('/timezone Kenya'));
    expect(db.rows('users')[0].timezone).toBe('Africa/Nairobi');
    expect(db.rows('users')[0].timezone_set_by_user).toBe(true);
    expect(sentTexts().join(' ')).toMatch(/Africa\/Nairobi/);
  });
  it('keeps her zone and helps when the input is not understood', async () => {
    await post(say('/timezone Atlantis'));
    expect(db.rows('users')[0].timezone).toBe('Africa/Lagos');
    expect(sentTexts().join(' ')).toMatch(/didn't recognise/);
  });
  it('shows the current zone with no argument', async () => {
    await post(say('/timezone'));
    expect(sentTexts().join(' ')).toMatch(/Africa\/Lagos/);
  });
});

describe('quick-log buttons', () => {
  it('saves a symptom entry for today from one tap', async () => {
    await post(tap('ql_cramps'));
    const rows = db.rows('memory_log');
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ user_id: 'u1', category: 'symptom', summary: 'Cramps', source: 'user' });
    expect(rows[0].event_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(sentTexts().join(' ')).toMatch(/Logged/);
  });
});

describe('/sleep and audio', () => {
  it('says audio is coming when no tracks exist', async () => {
    await post(say('/sleep'));
    expect(sentTexts().join(' ')).toMatch(/coming soon/);
  });
  it('offers tracks as buttons and sends one when tapped', async () => {
    db.seed('audio_tracks', [{ id: 'a1', kind: 'sleep', purpose: null, title: 'Rain', duration_seconds: 600, audio_url: 'https://x/y.mp3', telegram_file_id: null, active: true }]);
    await post(say('/sleep'));
    expect(JSON.stringify(sent.find(s => s.method === 'sendMessage')?.body.reply_markup)).toMatch(/aud_a1/);
    await post(tap('aud_a1'));
    expect(sent.some(s => s.method === 'sendAudio' && s.body.audio === 'https://x/y.mp3')).toBe(true);
  });
});

describe('deleting an account', () => {
  const confirm = () => { db.rows('users')[0].onboarding_step = 99; return post(say('YES DELETE')); };
  it('removes the user and says so', async () => {
    await confirm();
    expect(db.rows('users')).toHaveLength(0);
    expect(sentTexts().join(' ')).toMatch(/deleted/);
  });
  it('does NOT claim success when the delete fails', async () => {
    db.failNext('users', 'delete');
    await confirm();
    expect(db.rows('users')).toHaveLength(1);
    expect(sentTexts().join(' ')).toMatch(/couldn't finish deleting/);
    expect(sentTexts().join(' ')).not.toMatch(/All your data has been deleted/);
  });
});

describe('remedy check-in reply', () => {
  it('records "it helped" against the remedy Ava just asked about', async () => {
    db.seed('user_remedies', [{ id: 'r1', user_id: 'u1', remedy_id: 'rem1', remedy_name: 'Spearmint Tea', condition: 'cycle_acne', outcome: null, active: true, follow_up_sent_at: new Date().toISOString() }]);
    const { applyFollowUpReply } = await import('@/lib/ava/remedy-engine');
    const out: string[] = [];
    const handled = await applyFollowUpReply(1, db.rows('users')[0] as any, 'it helped', async (_c, t) => { out.push(t); });
    expect(handled).toBe(true);
    expect(db.rows('user_remedies')[0].outcome).toBe('helped');
    expect(out.join(' ')).toMatch(/worked/);
  });
  it('ignores a reply when no check-in is waiting', async () => {
    const { applyFollowUpReply } = await import('@/lib/ava/remedy-engine');
    expect(await applyFollowUpReply(1, db.rows('users')[0] as any, 'it helped', async () => {})).toBe(false);
  });
});
