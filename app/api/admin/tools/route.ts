import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase';
import { guardAdmin } from '@/lib/admin/auth';
import { ENABLED_LANGS, hubPath, toolPath } from '@/lib/site';
import { TOOLS, toolById } from '@/lib/tools/registry';
import { TOOL_CONTENT_COLS, ToolContentRow } from '@/lib/tools/content';
import { countWords } from '@/lib/admin/content-ai';

export const dynamic = 'force-dynamic';

const lang = z.enum(ENABLED_LANGS as unknown as [string, ...string[]]);
const nullable = (max: number) => z.string().max(max).nullable().default(null).transform(v => (v && v.trim() ? v : null));

const Upsert = z.object({
  tool_id: z.string().min(1).max(80),
  language: lang,
  title: nullable(200),
  h1: nullable(200),
  description: nullable(400),
  intro: nullable(800),
  article: nullable(60000),
  faqs: z.array(z.object({ q: z.string(), a: z.string() })).max(20).default([])
    .transform(a => a.filter(f => f.q.trim() && f.a.trim())),
  // Only for a real, named clinician who has actually reviewed the page.
  reviewed_by: z.object({
    name: z.string().min(1).max(120), credentials: z.string().min(1).max(200),
    date: z.string().min(4).max(40), url: z.string().url().max(300).optional().or(z.literal('')),
  }).nullable().default(null),
});

const revalidate = (language: string, slug: string) => {
  const l = language as (typeof ENABLED_LANGS)[number];
  revalidatePath(toolPath(l, slug));
  revalidatePath(hubPath(l, 'tools'));
};

export async function GET(req: NextRequest) {
  const denied = guardAdmin(req);
  if (denied) return denied;
  const id = req.nextUrl.searchParams.get('id');
  const language = req.nextUrl.searchParams.get('language') ?? 'en';

  if (id) {
    const tool = toolById(id);
    const base = tool?.text[language as (typeof ENABLED_LANGS)[number]];
    if (!tool || !base) return NextResponse.json({ error: 'Tool not found for this language' }, { status: 404 });
    const { data, error } = await supabaseAdmin.from('tool_content').select(TOOL_CONTENT_COLS).eq('tool_id', id).eq('language', language).maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ base, override: (data as ToolContentRow) ?? null });
  }

  const { data, error } = await supabaseAdmin.from('tool_content').select('tool_id,language,article,updated_at');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const overrides = new Map((data ?? []).map(r => [`${r.tool_id}:${r.language}`, r]));
  const tools = TOOLS.flatMap(t => ENABLED_LANGS.flatMap(l => {
    const text = t.text[l];
    if (!text) return [];
    const o = overrides.get(`${t.id}:${l}`);
    return [{
      id: t.id, language: l, slug: text.slug, h1: text.h1, category: t.category ?? null,
      codeWords: countWords(text.article ?? ''),
      customised: !!o, customWords: o?.article ? countWords(o.article) : null, updated_at: o?.updated_at ?? null,
    }];
  }));
  return NextResponse.json({ tools });
}

export async function POST(req: NextRequest) {
  const denied = guardAdmin(req);
  if (denied) return denied;

  let d: z.infer<typeof Upsert>;
  try { d = Upsert.parse(await req.json()); }
  catch (e) { return NextResponse.json({ error: e instanceof z.ZodError ? e.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ') : 'Invalid request' }, { status: 400 }); }

  const tool = toolById(d.tool_id);
  const base = tool?.text[d.language as (typeof ENABLED_LANGS)[number]];
  if (!tool || !base) return NextResponse.json({ error: 'Unknown tool or language' }, { status: 404 });

  const { error } = await supabaseAdmin.from('tool_content').upsert({
    tool_id: d.tool_id, language: d.language,
    title: d.title, h1: d.h1, description: d.description, intro: d.intro, article: d.article,
    faqs: d.faqs.length ? d.faqs : null,
    reviewed_by: d.reviewed_by ? { ...d.reviewed_by, url: d.reviewed_by.url || undefined } : null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'tool_id,language' });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  revalidate(d.language, base.slug);
  return NextResponse.json({ ok: true });
}

/** Reverts a tool page to the copy in code. */
export async function DELETE(req: NextRequest) {
  const denied = guardAdmin(req);
  if (denied) return denied;
  const id = req.nextUrl.searchParams.get('id');
  const language = req.nextUrl.searchParams.get('language') ?? 'en';
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const base = toolById(id)?.text[language as (typeof ENABLED_LANGS)[number]];
  const { error } = await supabaseAdmin.from('tool_content').delete().eq('tool_id', id).eq('language', language);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (base) revalidate(language, base.slug);
  return NextResponse.json({ ok: true });
}
