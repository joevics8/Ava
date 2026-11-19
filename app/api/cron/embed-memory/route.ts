import { NextResponse } from 'next/server';
import { embedMissingMemories } from '@/lib/ava/db';
import { embedMissingConditions } from '@/lib/ava/condition-match';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Adds the meaning-search vector to memory entries that do not have one yet, and to the
// remedy conditions (used to match a symptom message by meaning). Safe to call repeatedly:
// it only fills in what is missing. No secret: it cannot read or change anything else.
export async function GET() {
  try {
    const memories = await embedMissingMemories(30);
    const conditions = await embedMissingConditions(40);
    return NextResponse.json({ memories, conditions });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 });
  }
}
