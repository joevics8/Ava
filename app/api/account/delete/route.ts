import { NextRequest, NextResponse } from 'next/server';
import { verifySessionCookie } from '@/lib/session';

export async function POST(req: NextRequest) {
  const session = verifySessionCookie(req.cookies.get('ava_session')?.value);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { telegram_id } = session;
  try {
    const { deleteAccount } = await import('@/lib/ava/db');
    await deleteAccount(telegram_id);
  } catch (err) {
    console.error('Account deletion failed:', err);
    return NextResponse.json({ error: 'Could not delete everything. Please try again.' }, { status: 500 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.delete('ava_session');
  return res;
}
