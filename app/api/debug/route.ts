import { NextRequest, NextResponse } from 'next/server';

// Previously wide open — anyone could hit this, burn a Gemini API call on
// your quota, and get back confirmation of whether your key is valid.
// Gated behind CRON_SECRET (already a server-only secret in env, no new
// var needed) as a query param, e.g. /api/debug?secret=...
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const key = process.env.GEMINI_API_KEY;

  if (!key) {
    return NextResponse.json({ error: 'GEMINI_API_KEY is missing from env vars' });
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'Say "Ava works!" and nothing else.' }] }],
        }),
      }
    );
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
    return NextResponse.json({ 
      key_present: true,
      status: res.status,
      gemini_response: text,
      error: res.ok ? null : data?.error?.message,
    });
  } catch (err: any) {
    return NextResponse.json({ key_present: true, fetch_error: err.message });
  }
}
