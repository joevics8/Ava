import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase';
import { guardAdmin } from '@/lib/admin/auth';

export const dynamic = 'force-dynamic';

const Create = z.object({
  kind: z.enum(['meditation', 'sleep', 'motivation']),
  purpose: z.string().trim().max(40).optional().or(z.literal('')),
  title: z.string().trim().min(2).max(64),
  duration_seconds: z.number().int().min(1).max(14400).nullable().optional(),
  audio_url: z.string().trim().url().max(1000).refine(u => u.startsWith('https://'), 'URL must start with https://'),
}).refine(d => d.kind !== 'meditation' || !!d.purpose, { message: 'Meditation tracks need a purpose (morning, stress, overthinking, sleep...)', path: ['purpose'] });

export async function GET(req: NextRequest) {
  const denied = await guardAdmin(req);
  if (denied) return denied;
  const { data, error } = await supabaseAdmin.from('audio_tracks').select('*').order('created_at', { ascending: false }).limit(500);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tracks: data ?? [] });
}

export async function POST(req: NextRequest) {
  const denied = await guardAdmin(req);
  if (denied) return denied;
  let d: z.infer<typeof Create>;
  try { d = Create.parse(await req.json()); }
  catch (e) { return NextResponse.json({ error: e instanceof z.ZodError ? e.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ') : 'Invalid request' }, { status: 400 }); }
  const { error } = await supabaseAdmin.from('audio_tracks').insert({
    kind: d.kind, purpose: d.kind === 'meditation' ? d.purpose : null, title: d.title,
    duration_seconds: d.duration_seconds ?? null, audio_url: d.audio_url,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

/** Turn a track on or off. */
export async function PATCH(req: NextRequest) {
  const denied = await guardAdmin(req);
  if (denied) return denied;
  let b: { id?: string; active?: boolean } = {};
  try { b = await req.json(); } catch { /* empty */ }
  if (!b.id || typeof b.active !== 'boolean') return NextResponse.json({ error: 'id and active required' }, { status: 400 });
  const { error } = await supabaseAdmin.from('audio_tracks').update({ active: b.active }).eq('id', b.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const denied = await guardAdmin(req);
  if (denied) return denied;
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const { error } = await supabaseAdmin.from('audio_tracks').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
