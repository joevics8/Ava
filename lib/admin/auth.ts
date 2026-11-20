import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Admin access = a Supabase Auth user with app_metadata.role "admin" or a confirmed email in admin_emails.
// app_metadata can only be changed with the service-role key, so nobody can give
// themselves the role by signing up. There is no signup page: users are created in
// the Supabase dashboard (Authentication > Users) and then given the role.
//
// Login (/api/admin/login) checks the password with Supabase, then sets a signed,
// httpOnly cookie holding only the user id and an expiry. Every request re-checks with
// Supabase that the user still exists and still has the admin role, so removing the
// role locks that person out immediately.

export const ADMIN_COOKIE = 'verm_admin';
export const ADMIN_SESSION_HOURS = 12;

function secret(): string {
  const base = process.env.ADMIN_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base) throw new Error('No secret available to sign admin sessions');
  return crypto.createHash('sha256').update(base + ':verm-admin-session').digest('hex');
}

const sign = (payload: string) => crypto.createHmac('sha256', secret()).update(payload).digest('base64url');

export function createAdminCookie(userId: string, now = Date.now()): string {
  const body = Buffer.from(JSON.stringify({ uid: userId, exp: now + ADMIN_SESSION_HOURS * 3600_000 })).toString('base64url');
  return `${body}.${sign(body)}`;
}

/** The user id inside a valid, unexpired cookie, else null. */
export function readAdminCookie(value: string | undefined, now = Date.now()): string | null {
  if (!value) return null;
  const [body, sig] = value.split('.');
  if (!body || !sig) return null;
  let expected: string;
  try { expected = sign(body); } catch { return null; }
  const a = Buffer.from(sig), b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    return typeof p.uid === 'string' && typeof p.exp === 'number' && p.exp > now ? p.uid : null;
  } catch { return null; }
}

/**
 * Admin = a Supabase Auth user who either has app_metadata.role = "admin" or has a CONFIRMED email
 * listed in the admin_emails table. Asked fresh every time, so removing either locks them out at once.
 * (Confirmed matters: with an unconfirmed address, anyone could sign up as that email.)
 */
export function adminDecision(user: { email?: string | null; email_confirmed_at?: string | null; app_metadata?: Record<string, unknown> | null }, listed: boolean): boolean {
  if (user.app_metadata?.role === 'admin') return true;
  return !!user.email && !!user.email_confirmed_at && listed;
}

export async function userIsAdmin(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (error || !data?.user) return false;
    const u = data.user;
    if (u.app_metadata?.role === 'admin') return true;
    if (!u.email || !u.email_confirmed_at) return false;
    const { data: row } = await supabaseAdmin.from('admin_emails').select('email').eq('email', u.email.toLowerCase()).maybeSingle();
    return adminDecision(u, !!row);
  } catch { return false; }
}

export async function isAdminCookie(value: string | undefined): Promise<boolean> {
  const uid = readAdminCookie(value);
  return !!uid && (await userIsAdmin(uid));
}

/**
 * Guard for every /api/admin route (except login). Returns an error response to send back,
 * or null when the request may proceed. Writes must also come from this site (Origin check)
 * and POSTs must be JSON, so another site cannot make a logged-in admin's browser change content.
 */
export async function guardAdmin(req: NextRequest): Promise<NextResponse | null> {
  if (!(await isAdminCookie(req.cookies.get(ADMIN_COOKIE)?.value))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return checkWriteOrigin(req);
}

export function checkWriteOrigin(req: NextRequest): NextResponse | null {
  if (req.method !== 'GET') {
    const origin = req.headers.get('origin');
    if (origin) {
      let ok = false;
      try { ok = new URL(origin).host === req.headers.get('host'); } catch { /* bad origin */ }
      if (!ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (req.method === 'POST' && !req.headers.get('content-type')?.includes('application/json')) {
      return NextResponse.json({ error: 'Expected JSON' }, { status: 415 });
    }
  }
  return null;
}
