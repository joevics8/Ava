import { NextRequest, NextResponse } from 'next/server';
import { guardAdmin } from '@/lib/admin/auth';
import { matchConditionsByMeaning, pickCondition, conditionMin, conditionMargin } from '@/lib/ava/condition-match';
import { detectCondition } from '@/lib/ava/remedies';

export const dynamic = 'force-dynamic';

// Calibration: /api/admin/condition-check?text=my belly feels heavy  (admin login required)
export async function GET(req: NextRequest) {
  const denied = await guardAdmin(req);
  if (denied) return denied;
  const text = (req.nextUrl.searchParams.get('text') || '').slice(0, 300);
  if (!text) return NextResponse.json({ error: 'text required' }, { status: 400 });
  const matches = await matchConditionsByMeaning(text, 5);
  return NextResponse.json({
    text, byWord: detectCondition(text), min: conditionMin(), margin: conditionMargin(),
    byMeaning: pickCondition(matches), top: matches,
  });
}
