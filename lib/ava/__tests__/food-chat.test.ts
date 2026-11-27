import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const getCycleData = vi.fn();
vi.mock('../db', async (orig) => ({ ...(await orig<typeof import('../db')>()), getCycleData: (...a: any[]) => (getCycleData as any)(...a) }));

import { handleConversation } from '../ai';

const user: any = {
  id: 'u1', telegram_id: 1, name: 'Ada', age: 28, country: 'Nigeria', reproductive_goal: 'track', conditions: null, birth_control: null,
  plan: 'free', food_profile: { diet: 'vegetarian', avoid: 'beans', budget: 'Budget' },
};

let sent: string[] = [];
beforeEach(() => {
  sent = []; getCycleData.mockReset();
  getCycleData.mockResolvedValue({ period_start_dates: ['2026-11-20'], avg_cycle_length: 28, period_duration: 5, next_period_start: '2026-12-18' });
  vi.useFakeTimers(); vi.setSystemTime(new Date('2026-11-27T08:00:00Z'));
  vi.stubGlobal('fetch', vi.fn(async (_url: string, init: any) => {
    sent.push(init.body);
    return { ok: true, status: 200, json: async () => ({ candidates: [{ content: { parts: [{ text: 'ok' }] }, finishReason: 'STOP' }] }), text: async () => '' } as any;
  }));
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('handleConversation: food context reaches the model', () => {
  it('adds her country, cycle day, picks and preferences when she asks about food', async () => {
    const reply = await handleConversation(user, 'what should I eat today? I feel tired', [], [], 'ctx', 'chat');
    expect(reply).toBe('ok');
    const body = sent.join('\n');
    expect(body).toContain('FOOD CONTEXT (she is asking about food)');
    expect(body).toContain('Nigeria');
    expect(body).toContain('Cycle day 8');
    expect(body).toContain("Today's picks");
    expect(body).toContain('Way of eating: vegetarian');
    expect(body).toContain('Budget: Budget');
    const ctx = body.slice(body.indexOf('FOOD CONTEXT (she'), body.indexOf('FOOD CONTEXT (she') + 1500);
    const lists = ctx.split('\\n').filter(l => /Local foods|Today's picks/.test(l)).join(' ');
    expect(lists).not.toMatch(/\b(beef|chicken|goat|fish|beans?)\b/i);
  });

  it('adds nothing for non-food messages (and skips the cycle lookup)', async () => {
    await handleConversation(user, 'is spotting before my period normal?', [], [], 'ctx', 'chat');
    expect(sent.join('\n')).not.toContain('FOOD CONTEXT (she is asking about food)');
    expect(getCycleData).not.toHaveBeenCalled();
  });

  it('still answers if the cycle lookup fails', async () => {
    getCycleData.mockRejectedValue(new Error('db down'));
    const reply = await handleConversation(user, 'any breakfast ideas?', [], [], 'ctx', 'chat');
    expect(reply).toBe('ok');
    expect(sent.join('\n')).toContain('FOOD CONTEXT (she is asking about food)');
  });
});
