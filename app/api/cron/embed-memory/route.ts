import { NextResponse } from 'next/server';
import { embedMissingMemories } from '@/lib/ava/db';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Adds the meaning-search vector to memory entries that do not have one yet (entries
// saved before embeddings existed, or when embedding failed). Safe to call repeatedly:
// it only touches entries without a vector, 40 at a time. Like the blog-queue job it has
// no secret: it cannot read or change anything except to fill in those vectors.
export async function GET() {
  try {
    return NextResponse.json(await embedMissingMemories(40));
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 });
  }
}
