export type Plan = 'free' | 'premium';
export type ReproductiveGoal = 'track' | 'prevent' | 'conceive' | 'understand';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active';
export type MessageCategory = 'LOG' | 'RETRIEVAL' | 'CONVERSATION' | 'IMAGE';
export type LogCategory = 'symptom' | 'cycle' | 'insight' | 'sexual' | 'mood' | 'test' | 'chat' | 'bbt' | 'mucus';
export type CyclePhase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal';

export interface AvaUser {
  id: string;
  telegram_id: number;
  name: string | null;
  age: number | null;
  height: number | null;
  weight: number | null;
  reproductive_goal: ReproductiveGoal | null;
  activity_level: ActivityLevel | null;
  birth_control: string | null;
  conditions: string[] | null;
  onboarding_complete: boolean;
  onboarding_step: number;
  plan: Plan;
  email: string | null;
  created_at: string;
}

export interface CycleData {
  id: string;
  user_id: string;
  period_start_dates: string[];
  avg_cycle_length: number | null;
  period_duration: number | null;
  next_period_start: string | null;
  next_period_end: string | null;
  next_ovulation_start: string | null;
  next_ovulation_end: string | null;
  confidence_pct: number | null;
  updated_at: string;
}

export interface MemoryLog {
  id: string;
  user_id: string;
  category: LogCategory;
  summary: string;
  logged_at: string;
}
