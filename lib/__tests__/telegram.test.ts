import { describe, it, expect } from 'vitest';
import { sendTelegram, plainText, splitForTelegram } from '../telegram';

function fake(statuses: number[]) {
  const calls: any[] = [];
  const fetchImpl = (async (_u: string, init: any) => {
    calls.push(JSON.parse(init.body));
    const status = statuses.shift() ?? 200;
    return { ok: status === 200, status, json: async () => ({}) } as any;
  }) as unknown as typeof fetch;
  return { calls, fetchImpl };
}

describe('sendTelegram', () => {
  it('retries as plain text when Markdown is rejected', async () => {
    const { calls, fetchImpl } = fake([400, 200]);
    const r = await sendTelegram(1, 'Hi *Jo_hn* here', { markdown: true, fetchImpl, token: 't' });
    expect(r).toEqual({ ok: true, blocked: false });
    expect(calls[0].parse_mode).toBe('Markdown');
    expect(calls[1].parse_mode).toBeUndefined();
    expect(calls[1].text).toBe('Hi John here');
  });
  it('reports a blocked bot without retrying', async () => {
    const { calls, fetchImpl } = fake([403]);
    expect(await sendTelegram(1, 'hi', { markdown: true, fetchImpl, token: 't' })).toEqual({ ok: false, blocked: true });
    expect(calls).toHaveLength(1);
  });
  it('keeps the keyboard on the last chunk only', async () => {
    const { calls, fetchImpl } = fake([]);
    await sendTelegram(1, ('word '.repeat(1500)).trim(), { fetchImpl, token: 't', keyboard: [[{ text: 'a', callback_data: 'a' }]] });
    expect(calls.length).toBeGreaterThan(1);
    expect(calls[0].reply_markup).toBeUndefined();
    expect(calls[calls.length - 1].reply_markup).toBeTruthy();
  });
  it('fails quietly without a token', async () => {
    expect((await sendTelegram(1, 'x', { token: '' })).ok).toBe(false);
  });
});
describe('helpers', () => {
  it('plainText strips markdown marks', () => expect(plainText('*a* _b_ `c` **d**')).toBe('a b c d'));
  it('splits long text under the limit', () => { for (const c of splitForTelegram('x '.repeat(5000))) expect(c.length).toBeLessThanOrEqual(4000); });
});
