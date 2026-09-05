// Remedy type — data now lives in Supabase remedies table
// To add new remedies: INSERT into the remedies table directly
// No code deployment needed

export type { Remedy } from './remedy-engine';

// Condition keyword detector — still used by webhook
export function detectCondition(message: string): string | null {
  const lower = message.toLowerCase();
  const map: Record<string, string> = {
    cramp: 'cramps', 'period pain': 'cramps', dysmenorrhea: 'cramps', 'stomach pain': 'cramps',
    bloat: 'bloating', 'water retention': 'bloating', swollen: 'bloating',
    acne: 'acne', breakout: 'acne', pimple: 'acne', spot: 'acne', blemish: 'acne',
    mood: 'pms_mood', irritable: 'pms_mood', pms: 'pms_mood', 'mood swing': 'pms_mood',
    'heavy flow': 'heavy_flow', 'heavy period': 'heavy_flow', 'bleeding a lot': 'heavy_flow',
    'breast tender': 'breast_tenderness', 'sore breast': 'breast_tenderness', boob: 'breast_tenderness',
    tired: 'fatigue', fatigue: 'fatigue', exhausted: 'fatigue', 'no energy': 'fatigue',
    irregular: 'irregular_cycles', pcos: 'irregular_cycles', 'missed period': 'irregular_cycles',
    sleep: 'sleep', insomnia: 'sleep', "can't sleep": 'sleep',
    discharge: 'vaginal_health', vaginal: 'vaginal_health',
  };

  for (const [keyword, cond] of Object.entries(map)) {
    if (lower.includes(keyword)) return cond;
  }
  return null;
}
