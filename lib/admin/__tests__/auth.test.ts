import { describe, it, expect, beforeAll, vi } from 'vitest';
import { NextRequest } from 'next/server';

const roles: Record<string, string | undefined> = { admin1: 'admin', user2: undefined };
vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: { auth: { admin: { getUserById: async (id: string) => (id in roles ? { data: { user: { id, app_metadata: roles[id] ? { role: roles[id] } : {} } }, error: null } : { data: { user: null }, error: { message: 'nf' } }) } } },
}));
beforeAll(() => { process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'; });

const mod = () => import('../auth');
const req = (method: string, cookie?: string, headers: Record<string, string> = {}) =>
  new NextRequest('http://localhost/api/admin/x', { method, headers: { host: 'localhost', ...(cookie ? { cookie: `verm_admin=${cookie}` } : {}), ...headers } });

describe('admin cookie', () => {
  it('round-trips, expires, and rejects tampering', async () => {
    const { createAdminCookie, readAdminCookie } = await mod();
    const c = createAdminCookie('admin1', 1000);
    expect(readAdminCookie(c, 2000)).toBe('admin1');
    expect(readAdminCookie(c, 1000 + 13 * 3600_000)).toBeNull();
    expect(readAdminCookie(c.replace('.', 'x.'), 2000)).toBeNull();
    expect(readAdminCookie('abc.def')).toBeNull();
    expect(readAdminCookie(undefined)).toBeNull();
  });
});

describe('guardAdmin', () => {
  it('rejects no cookie, a forged cookie, a user without the admin role and a deleted user', async () => {
    const { guardAdmin, createAdminCookie } = await mod();
    expect((await guardAdmin(req('GET')))?.status).toBe(401);
    expect((await guardAdmin(req('GET', 'abc.def')))?.status).toBe(401);
    expect((await guardAdmin(req('GET', createAdminCookie('user2'))))?.status).toBe(401);
    expect((await guardAdmin(req('GET', createAdminCookie('gone'))))?.status).toBe(401);
  });
  it('allows a user with the admin role', async () => {
    const { guardAdmin, createAdminCookie } = await mod();
    expect(await guardAdmin(req('GET', createAdminCookie('admin1')))).toBeNull();
  });
  it('blocks cross-site writes and non-JSON posts even for the admin', async () => {
    const { guardAdmin, createAdminCookie } = await mod();
    const c = createAdminCookie('admin1');
    expect((await guardAdmin(req('POST', c, { origin: 'https://evil.example', 'content-type': 'application/json' })))?.status).toBe(403);
    expect((await guardAdmin(req('POST', c, { origin: 'http://localhost', 'content-type': 'text/plain' })))?.status).toBe(415);
    expect(await guardAdmin(req('POST', c, { origin: 'http://localhost', 'content-type': 'application/json' }))).toBeNull();
    expect(await guardAdmin(req('DELETE', c, { origin: 'http://localhost' }))).toBeNull();
  });
});
