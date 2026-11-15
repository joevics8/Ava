import { NextRequest, NextResponse } from 'next/server';
import { verifySessionCookie, type SessionPayload } from '@/lib/session';

// The admin is the Telegram account the bot already treats as its owner
// (app/api/webhook/route.ts). Login is the normal Telegram login: the signed
// `ava_session` cookie must carry that Telegram id. Override with ADMIN_TELEGRAM_ID.
export const ADMIN_TELEGRAM_ID = Number(process.env.ADMIN_TELEGRAM_ID || 5944321602);

/** verifySessionCookie throws when TELEGRAM_BOT_TOKEN is missing; treat that as "not logged in". */
export function readSession(cookieValue: string | undefined): SessionPayload | null {
  try { return verifySessionCookie(cookieValue); } catch { return null; }
}

export function isAdminSession(session: SessionPayload | null): boolean {
  return !!session && Number(session.telegram_id) === ADMIN_TELEGRAM_ID;
}

/**
 * Guard for every /api/admin route. Returns an error response to send back, or
 * null when the request may proceed. Writes must also come from this site
 * (Origin check) and POSTs must be JSON, so another site cannot make a logged-in
 * admin's browser change content.
 */
export function guardAdmin(req: NextRequest): NextResponse | null {
  if (!isAdminSession(readSession(req.cookies.get('ava_session')?.value))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
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
