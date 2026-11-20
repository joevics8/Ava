import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { runApproval } from '@/lib/admin/blog-approval';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// For cron-job.org (GET, no secret, like the other content jobs). Checks held drafts, releases
// the ones that pass, and publishes released drafts at the daily cap. It can only act on drafts
// that pass the automatic checks, and it never writes or edits text.
export async function GET() {
  try {
    const summary = await runApproval();
    if (summary.published) { revalidatePath('/blog'); revalidatePath('/sitemap-blogs.xml'); }
    return NextResponse.json(summary);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 });
  }
}
