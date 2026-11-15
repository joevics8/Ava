import { describe, it, expect, beforeAll } from 'vitest';
import { NextRequest } from 'next/server';

beforeAll(() => { process.env.TELEGRAM_BOT_TOKEN = 'test-token'; process.env.ADMIN_TELEGRAM_ID = '111'; });

async function mod() {
  const auth = await import('../auth');
  const { createSessionCookie } = await import('@/lib/session');
  return { ...auth, createSessionCookie };
}
const req = (method: string, cookie?: string, headers: Record<string, string> = {}) =>
  new NextRequest('http://localhost/api/admin/x', { method, headers: { host: 'localhost', ...(cookie ? { cookie: `ava_session=${cookie}` } : {}), ...headers } });

describe('guardAdmin', () => {
  it('rejects no cookie, a forged cookie and a non-admin Telegram account', async () => {
    const { guardAdmin, createSessionCookie } = await mod();
    expect(guardAdmin(req('GET'))?.status).toBe(401);
    expect(guardAdmin(req('GET', 'abc.def'))?.status).toBe(401);
    expect(guardAdmin(req('GET', createSessionCookie({ telegram_id: 222 })))?.status).toBe(401);
  });
  it('allows the admin on GET', async () => {
    const { guardAdmin, createSessionCookie, ADMIN_TELEGRAM_ID } = await mod();
    expect(ADMIN_TELEGRAM_ID).toBe(111);
    expect(guardAdmin(req('GET', createSessionCookie({ telegram_id: 111 })))).toBeNull();
  });
  it('blocks cross-site writes and non-JSON posts even for the admin', async () => {
    const { guardAdmin, createSessionCookie } = await mod();
    const c = createSessionCookie({ telegram_id: 111 });
    expect(guardAdmin(req('POST', c, { origin: 'https://evil.example', 'content-type': 'application/json' }))?.status).toBe(403);
    expect(guardAdmin(req('POST', c, { origin: 'http://localhost', 'content-type': 'text/plain' }))?.status).toBe(415);
    expect(guardAdmin(req('POST', c, { origin: 'http://localhost', 'content-type': 'application/json' }))).toBeNull();
    expect(guardAdmin(req('DELETE', c, { origin: 'http://localhost' }))).toBeNull();
  });
});
