import { NextResponse } from 'next/server';

export async function GET() {
  const key = process.env.GEMINI_API_KEY;
  
  if (!key) {
    return NextResponse.json({ error: 'GEMINI_API_KEY is missing from env vars' });
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
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
