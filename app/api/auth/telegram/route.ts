import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams.entries());
  const { hash, ...data } = params;

  const checkString = Object.keys(data).sort().map(k => `${k}=${data[k]}`).join('\n');
  const secretKey = crypto.createHash('sha256').update(process.env.TELEGRAM_BOT_TOKEN!).digest();
  const hmac = crypto.createHmac('sha256', secretKey).update(checkString).digest('hex');

  if (hmac !== hash) return NextResponse.redirect(new URL('/login?error=invalid', req.url));

  const authDate = parseInt(data.auth_date);
  if (Date.now() / 1000 - authDate > 86400) return NextResponse.redirect(new URL('/login?error=expired', req.url));

  const { data: user } = await supabaseAdmin.from('users').select('*').eq('telegram_id', data.id).single();
  if (!user) return NextResponse.redirect(new URL('/login?error=notfound', req.url));

  const res = NextResponse.redirect(new URL('/dashboard', req.url));
  res.cookies.set('ava_session', JSON.stringify({
    telegram_id: data.id,
    name: data.first_name,
    photo: data.photo_url,
  }), { httpOnly: true, secure: true, maxAge: 60 * 60 * 24 * 7, path: '/' });

  return res;
}
