import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { handleConversation, handleRetrieval, classifyMessage, FLASH, PRO } from '../ai';
import { describeBodyContext } from '../body-context';
import type { AvaUser, CycleData } from '@/types';

const user = {
  id: 'u1',
  name: 'Ada',
  age: 28,
  country: 'Nigeria',
  reproductive_goal: 'track',
  conditions: null,
  birth_control: null,
  food_profile: null,
} as unknown as AvaUser;

const cycle: CycleData = {
  id: 'c1',
  user_id: 'u1',
  period_start_dates: ['2026-09-10'],
  avg_cycle_length: 30,
  period_duration: 5,
  next_period_start: '2026-10-08',
  next_period_end: '2026-10-12',
  next_ovulation_start: '2026-09-22',
  next_ovulation_end: '2026-09-25',
  confidence_pct: 70,
  updated_at: '2026-09-11T00:00:00Z',
};

type Call = { url: string; body: any };
let calls: Call[];

function okResponse(text: string) {
  return {
    ok: true,
    status: 200,
    json: async () => ({ candidates: [{ content: { parts: [{ text }] }, finishReason: 'STOP' }] }),
  };
}

beforeEach(() => {
  calls = [];
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-10-08T11:18:00Z'));
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('handleConversation prompt', () => {
  it('gives the model the real cycle position and the answer-the-why structure', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string, init: any) => {
      calls.push({ url, body: JSON.parse(init.body) });
      return okResponse('ok');
    }));

    const ctx = describeBodyContext(cycle, [], new Date('2026-10-08T11:18:00Z'));
    await handleConversation(user, 'No menstruation yet. But i am peeing a lot', [], [], ctx, 'chat');

    const sent = JSON.stringify(calls[0].body);
    expect(sent).toContain('cycle day 29 of ~30');
    expect(sent).toContain('NOT late');
    expect(sent).toContain('ENGAGE WITH HER OWN THEORY');
    expect(sent).toContain('first day of a missed period'); // pregnancy-test timing fact
    expect(sent).toContain('EMERGENCIES');
    // The old absolute rule that made Ava dodge the user's own theory is gone.
    expect(sent).not.toContain("exactly \\\"I'm not sure why that shifted");
    expect(sent).not.toContain('Nothing more.');
  });

  it('uses the short log-acknowledgement mode for logs', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string, init: any) => {
      calls.push({ url, body: JSON.parse(init.body) });
      return okResponse('ok');
    }));
    await handleConversation(user, 'She just told you: "headache"', [], [], '', 'log');
    expect(JSON.stringify(calls[0].body)).toContain('SHE IS LOGGING SOMETHING');
  });

  it('falls back to the second model instead of returning empty', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string, init: any) => {
      calls.push({ url, body: JSON.parse(init.body) });
      if (url.includes(PRO)) {
        return { ok: false, status: 404, json: async () => ({ error: { status: 'NOT_FOUND', message: 'model gone' } }) };
      }
      return okResponse('fallback answer');
    }));

    const out = await handleConversation(user, 'hello', [], [], '', 'chat');
    expect(out).toBe('fallback answer');
    expect(calls.some(c => c.url.includes(PRO))).toBe(true);
    expect(calls.some(c => c.url.includes(FLASH))).toBe(true);
  });

  it('returns an empty string (a real failure) when every model fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: false,
      status: 404,
      json: async () => ({ error: { status: 'NOT_FOUND' } }),
    })));
    expect(await handleConversation(user, 'hello', [], [], '', 'chat')).toBe('');
  });
});

describe('handleRetrieval prompt', () => {
  it('uses the app-computed cycle position and forbids guessing history', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string, init: any) => {
      calls.push({ url, body: JSON.parse(init.body) });
      return okResponse('ok');
    }));
    const ctx = describeBodyContext(cycle, [], new Date('2026-10-08T11:18:00Z'));
    await handleRetrieval(user, 'when is my period due', [], cycle, [], ctx);
    const sent = JSON.stringify(calls[0].body);
    expect(sent).toContain('CYCLE POSITION');
    expect(sent).toContain('say you don');
  });
});

describe('classifyMessage context', () => {
  it("shows the classifier Ava's previous message so a short reply is not logged as a new symptom", async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string, init: any) => {
      calls.push({ url, body: JSON.parse(init.body) });
      return okResponse('CONVERSATION');
    }));
    const result = await classifyMessage('Just more frequent', [
      { role: 'user', content: "I'm peeing a lot" },
      { role: 'model', content: 'Are you feeling any pressure or discomfort when you go?' },
    ]);
    expect(result).toBe('CONVERSATION');
    expect(JSON.stringify(calls[0].body)).toContain('Are you feeling any pressure or discomfort');
  });
});
