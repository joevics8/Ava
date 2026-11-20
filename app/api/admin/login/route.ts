import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ADMIN_COOKIE, ADMIN_SESSION_HOURS, checkWriteOrigin, createAdminCookie, userIsAdmin } from '@/lib/admin/auth';

export const dynamic = 'force-dynamic';

// Email + password through Supabase Auth. There is no signup. Wrong password and
// "not an admin" give the same answer so the form does not reveal which accounts exist.
const fails = new Map<string, { n: number; first: number }>();
const WINDOW_MS = 15 * 60_000, MAX_FAILS = 8;

function tooMany(key: string, now = Date.now()): boolean {
  const f = fails.get(key);
  if (!f) return false;
  if (now - f.first > WINDOW_MS) { fails.delete(key); return false; }
  return f.n >= MAX_FAILS;
}
function noteFail(key: string, now = Date.now()) {
  const f = fails.get(key);
  if (!f || now - f.first > WINDOW_MS) fails.set(key, { n: 1, first: now }); else f.n++;
}

export async function POST(req: NextRequest) {
  const bad = checkWriteOrigin(req);
  if (bad) return bad;
  const ip = (req.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim();
  if (tooMany(ip)) return NextResponse.json({ error: 'Too many attempts. Try again in a few minutes.' }, { status: 429 });

  let email = '', password = '';
  try { const b = await req.json(); email = String(b.email || '').trim().toLowerCase(); password = String(b.password || ''); } catch { /* empty */ }
  const generic = () => { noteFail(ip); return NextResponse.json({ error: 'Wrong email or password.' }, { status: 401 }); };
  if (!email || !password || email.length > 200 || password.length > 200) return generic();

  // A throwaway client: the password check must not touch the service client's state.
  const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await anon.auth.signInWithPassword({ email, password });
  if (error || !data.user) return generic();
  if (!(await userIsAdmin(data.user.id))) return generic();

  fails.delete(ip);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, createAdminCookie(data.user.id), {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/', maxAge: ADMIN_SESSION_HOURS * 3600,
  });
  return res;
}
