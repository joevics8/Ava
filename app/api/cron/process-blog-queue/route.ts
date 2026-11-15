import { NextRequest, NextResponse } from 'next/server';
import { waitUntil } from '@vercel/functions';
import { countPending, processQueue, supabaseStore } from '@/lib/admin/blog-queue';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

// Hourly, from cron-job.org. Takes the OLDEST saved articles (blog_queue,
// status not_processed), parses each with the same parser as /admin, and saves
// them to blog_posts as HELD drafts. This route writes no new text of its own
// beyond what the parser returns, and it never publishes: a human approves
// each draft in /admin/blog before the publish cron can release it.
//
// cron-job.org gives up on a request after ~30s but a parse can take longer, so
// the work continues in the background (waitUntil) and the reply is immediate.
// Add &wait=1 to run it inline and see the result (handy in a browser).
const PER_RUN = Number(process.env.BLOG_QUEUE_PER_RUN || 3);
const BUDGET_MS = Number(process.env.BLOG_QUEUE_BUDGET_MS || 70_000); // don't start another article after this

// No secret: this URL is open by design. It can only turn already-saved items into
// HELD drafts (never publishes), and the per-run cap bounds the Gemini cost.
export async function GET(req: NextRequest) {
  const run = () => processQueue({ store: supabaseStore }, { limit: PER_RUN, budgetMs: BUDGET_MS });

  if (req.nextUrl.searchParams.get('wait') === '1') {
    try { return NextResponse.json({ ...(await run()), pending: await countPending() }); }
    catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : 'failed' }, { status: 500 }); }
  }

  const pending = await countPending().catch(() => -1);
  if (pending === 0) return NextResponse.json({ started: false, pending: 0, reason: 'queue empty' });
  waitUntil(run().then(
    r => console.log('process-blog-queue', JSON.stringify({ saved: r.saved.length, failed: r.failed, skipped: r.skipped })),
    e => console.error('process-blog-queue failed', e instanceof Error ? e.message : e),
  ));
  return NextResponse.json({ started: true, pending });
}
