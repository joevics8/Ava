import { NextResponse } from 'next/server';
import { matchConditionsByMeaning, pickCondition } from '@/lib/ava/condition-match';
import { detectCondition } from '@/lib/ava/remedies';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// TEMPORARY calibration run: fixed phrases only (no user input), scores printed. Remove after tuning.
const SHOULD_MATCH = [
  'my belly feels heavy and tight', 'I feel so drained and sluggish today', 'my face is covered in little bumps',
  'I keep getting up at night to pee', 'my skin feels dry and flaky', 'I cannot fall asleep at all',
  'my lower back is killing me', 'I feel like crying for no reason', 'my breasts are so tender',
  'I feel gassy and puffed up', 'everything smells and makes me queasy', 'my scalp is itchy and flaking',
  'I feel dizzy when I stand up', 'my eyes feel puffy and swollen', 'I have no appetite at all',
  'I am craving sweet things nonstop', 'my legs feel restless at night', 'there is a burning feeling when I wee',
];
const SHOULD_NOT = [
  'what is the weather like today', 'I had a great day at work', 'thank you so much', 'how long is a normal cycle',
  'my boyfriend and I argued', 'can you recommend a movie', 'I am going shopping later', 'what does ovulation mean',
  'remind me to drink water', 'I love you Ava', 'my phone battery is dying', 'I started a new job today',
];

export async function GET() {
  const rows: any[] = [];
  for (const [kind, list] of [['match', SHOULD_MATCH], ['nomatch', SHOULD_NOT]] as const) {
    for (const text of list) {
      const top = await matchConditionsByMeaning(text, 3);
      rows.push({ kind, text, byWord: detectCondition(text), picked: pickCondition(top), top: top.map(t => `${t.condition} ${t.similarity.toFixed(3)}`) });
    }
  }
  return NextResponse.json(rows);
}
