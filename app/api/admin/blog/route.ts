import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase';
import { guardAdmin } from '@/lib/admin/auth';
import { ENABLED_LANGS, blogPath, hubPath } from '@/lib/site';
import { notifySearchEngines } from '@/lib/search-ping';
import { slugify } from '@/lib/admin/content-ai';

export const dynamic = 'force-dynamic';

const LIST_COLS = 'slug,language,title,category,published,review_hold,published_at,updated_at';
const lang = z.enum(ENABLED_LANGS as unknown as [string, ...string[]]);

/**
 * state:
 *  - hold: draft, not released. The publish cron skips it (review_hold = true).
 *  - queued: approved draft. The cron may release it, up to BLOG_DAILY_CAP a day.
 *  - published: live now.
 */
const Upsert = z.object({
  create: z.boolean().default(false), // new post: refuse to overwrite an existing slug
  slug: z.string().min(1).max(100),
  language: lang,
  title: z.string().min(1).max(200),
  excerpt: z.string().max(600).nullable().default(null),
  meta_description: z.string().max(300).nullable().default(null),
  content: z.string().min(1).max(200000),
  category: z.string().max(60).nullable().default(null),
  read_time: z.number().int().min(1).max(120).nullable().default(null),
  faqs: z.array(z.object({ q: z.string().min(1), a: z.string().min(1) })).max(20).default([]),
  related_tool_ids: z.array(z.string().max(80)).max(8).default([]),
  state: z.enum(['hold', 'queued', 'published']),
});

const revalidate = (language: string, slug: string) => {
  const l = language as (typeof ENABLED_LANGS)[number];
  revalidatePath(blogPath(l, slug));
  revalidatePath(hubPath(l, 'blog'));
  revalidatePath('/sitemap-blogs.xml');
};

export async function GET(req: NextRequest) {
  const denied = guardAdmin(req);
  if (denied) return denied;
  const slug = req.nextUrl.searchParams.get('slug');
  const language = req.nextUrl.searchParams.get('language') ?? 'en';

  if (slug) {
    const { data, error } = await supabaseAdmin.from('blog_posts').select('*').eq('slug', slug).eq('language', language).maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ post: data });
  }
  const { data, error } = await supabaseAdmin.from('blog_posts').select(LIST_COLS).order('updated_at', { ascending: false }).limit(500);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ posts: data ?? [] });
}

export async function POST(req: NextRequest) {
  const denied = guardAdmin(req);
  if (denied) return denied;

  let d: z.infer<typeof Upsert>;
  try { d = Upsert.parse(await req.json()); }
  catch (e) { return NextResponse.json({ error: e instanceof z.ZodError ? e.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ') : 'Invalid request' }, { status: 400 }); }

  const slug = slugify(d.slug);
  if (!slug) return NextResponse.json({ error: 'Slug is empty after cleaning.' }, { status: 400 });

  const { data: existing, error: eErr } = await supabaseAdmin.from('blog_posts').select('id,published,published_at').eq('slug', slug).eq('language', d.language).maybeSingle();
  if (eErr) return NextResponse.json({ error: eErr.message }, { status: 500 });

  if (d.create && existing) return NextResponse.json({ error: `A post with the slug “${slug}” already exists. Change the slug.` }, { status: 409 });

  const publishing = d.state === 'published';
  const row = {
    slug, language: d.language, title: d.title, excerpt: d.excerpt, meta_description: d.meta_description,
    content: d.content, category: d.category, read_time: d.read_time, faqs: d.faqs, related_tool_ids: d.related_tool_ids,
    published: publishing,
    review_hold: d.state === 'hold',
    // Keep the original publish date when re-saving a live post.
    published_at: publishing ? (existing?.published ? existing.published_at : new Date().toISOString()) : null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabaseAdmin.from('blog_posts').upsert(row, { onConflict: 'language,slug' });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  revalidate(d.language, slug);
  let ping: unknown = null;
  if (publishing && !existing?.published) { try { ping = await notifySearchEngines([{ slug, language: d.language }]); } catch { /* best effort */ } }
  return NextResponse.json({ ok: true, slug, ping });
}

export async function DELETE(req: NextRequest) {
  const denied = guardAdmin(req);
  if (denied) return denied;
  const slug = req.nextUrl.searchParams.get('slug');
  const language = req.nextUrl.searchParams.get('language') ?? 'en';
  if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 });
  const { error } = await supabaseAdmin.from('blog_posts').delete().eq('slug', slug).eq('language', language);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidate(language, slug);
  return NextResponse.json({ ok: true });
}
