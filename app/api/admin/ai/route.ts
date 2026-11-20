import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { guardAdmin } from '@/lib/admin/auth';
import { runJob } from '@/lib/admin/run';

export const dynamic = 'force-dynamic';
export const maxDuration = 120; // long articles take a while; Vercel caps this by plan

// One endpoint for the three AI jobs. It only returns text for a human to review:
// nothing here saves or publishes anything.
const Body = z.object({
  mode: z.enum(['parse', 'rewrite', 'write']),
  kind: z.enum(['blog', 'tool']),
  language: z.string().min(2).max(5).default('en'),
  keywords: z.string().max(1000).optional(),
  instructions: z.string().max(3000).optional(),
  targetWords: z.number().int().min(300).max(3000).optional(),
  topic: z.string().max(4000).optional(),
  title: z.string().max(300).optional(),
  body: z.string().max(80000).optional(),
  meta_description: z.string().max(500).optional(),
  excerpt: z.string().max(800).optional(),
  faqs: z.array(z.object({ q: z.string().max(500), a: z.string().max(3000) })).max(20).optional(),
}).superRefine((v, ctx) => {
  if ((v.mode === 'parse' || v.mode === 'rewrite') && !v.body?.trim()) ctx.addIssue({ code: 'custom', message: 'Paste the text to work on first.' });
  if (v.mode === 'write' && !v.topic?.trim()) ctx.addIssue({ code: 'custom', message: 'Describe the topic to write about.' });
  if (v.mode === 'write' && v.kind !== 'blog') ctx.addIssue({ code: 'custom', message: 'Writing from a brief is only for blog posts.' });
});

export async function POST(req: NextRequest) {
  const denied = await guardAdmin(req);
  if (denied) return denied;

  let input;
  try { input = Body.parse(await req.json()); }
  catch (e) {
    const msg = e instanceof z.ZodError ? e.issues.map(i => i.message).join('; ') : 'Invalid request';
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  try {
    const out = await runJob(input);
    return NextResponse.json(out);
  } catch (e) {
    console.error('admin ai', e instanceof Error ? e.message : e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'AI job failed' }, { status: 502 });
  }
}
