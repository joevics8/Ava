import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase';
import { guardAdmin } from '@/lib/admin/auth';
import { ENABLED_LANGS } from '@/lib/site';
import { MAX_ATTEMPTS, QUEUE_MAX_CHARS, processQueue, supabaseStore } from '@/lib/admin/blog-queue';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const LIST_COLS = 'id,language,status,attempts,last_error,note,post_slug,created_at,processed_at,chars,preview';

const Add = z.object({
  content: z.string().min(100, 'Paste the whole article (at least 100 characters).').max(QUEUE_MAX_CHARS, `Too long: the limit is ${QUEUE_MAX_CHARS} characters.`),
  language: z.enum(ENABLED_LANGS as unknown as [string, ...string[]]).default('en'),
});
const Retry = z.object({ retry: z.string().uuid() });
const Run = z.object({ process: z.literal(true) });

export async function GET(req: NextRequest) {
  const denied = await guardAdmin(req);
  if (denied) return denied;

  const id = req.nextUrl.searchParams.get('id');
  if (id) { // full text, only when Paste is pressed
    const { data, error } = await supabaseAdmin.from('blog_queue').select('id,content,language').eq('id', id).maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ item: data });
  }

  const [pending, processed] = await Promise.all([
    supabaseAdmin.from('blog_queue').select(LIST_COLS).eq('status', 'not_processed').order('created_at', { ascending: true }).limit(200),
    supabaseAdmin.from('blog_queue').select(LIST_COLS).eq('status', 'processed').order('processed_at', { ascending: false }).limit(20),
  ]);
  const err = pending.error ?? processed.error;
  if (err) return NextResponse.json({ error: err.message }, { status: 500 });
  return NextResponse.json({ pending: pending.data ?? [], processed: processed.data ?? [], maxAttempts: MAX_ATTEMPTS });
}

export async function POST(req: NextRequest) {
  const denied = await guardAdmin(req);
  if (denied) return denied;

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  // Run the oldest item now (same code as the hourly cron), so the pipeline can be checked without waiting.
  if (Run.safeParse(body).success) {
    try { return NextResponse.json(await processQueue({ store: supabaseStore }, { limit: 1, budgetMs: 60_000 })); }
    catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 }); }
  }

  const retry = Retry.safeParse(body);
  if (retry.success) { // a failed item (gave up after MAX_ATTEMPTS) gets a fresh set of tries
    const { error } = await supabaseAdmin.from('blog_queue').update({ attempts: 0, last_error: null }).eq('id', retry.data.retry).eq('status', 'not_processed');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  const add = Add.safeParse(body);
  if (!add.success) return NextResponse.json({ error: add.error.issues.map(i => i.message).join('; ') }, { status: 400 });
  const { data, error } = await supabaseAdmin.from('blog_queue').insert({ content: add.data.content, language: add.data.language }).select('id').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id: data.id });
}

export async function DELETE(req: NextRequest) {
  const denied = await guardAdmin(req);
  if (denied) return denied;
  const id = req.nextUrl.searchParams.get('id');
  if (!id || !z.string().uuid().safeParse(id).success) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const { error } = await supabaseAdmin.from('blog_queue').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
