-- ─── Ava: Period & Wellness Tracker ──────────────────────────────────────────
-- Run this in Supabase SQL Editor

-- Users table
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  telegram_id bigint unique not null,
  name text,
  age int,
  height numeric,
  weight numeric,
  reproductive_goal text check (reproductive_goal in ('track', 'prevent', 'conceive', 'understand')),
  activity_level text check (activity_level in ('sedentary', 'light', 'moderate', 'active')),
  birth_control text,
  conditions text[],
  onboarding_complete boolean default false,
  onboarding_step int default 0,
  plan text default 'free' check (plan in ('free', 'premium')),
  email text,
  created_at timestamptz default now()
);

-- Cycle data table
create table if not exists cycle_data (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade not null,
  period_start_dates date[],
  avg_cycle_length numeric,
  period_duration int,
  next_period_start date,
  next_period_end date,
  next_ovulation_start date,
  next_ovulation_end date,
  confidence_pct int,
  updated_at timestamptz default now(),
  unique(user_id)
);

-- Memory log table (core AI memory)
create table if not exists memory_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade not null,
  category text not null check (category in (
    'symptom', 'cycle', 'insight', 'sexual', 'mood', 'test', 'chat', 'bbt', 'mucus', 'flow'
  )),
  summary text not null,
  logged_at timestamptz default now()
);

-- Indexes for fast memory retrieval
create index if not exists memory_log_user_id_idx on memory_log(user_id);
create index if not exists memory_log_logged_at_idx on memory_log(logged_at desc);
create index if not exists memory_log_user_date_idx on memory_log(user_id, logged_at desc);

-- Enable RLS
alter table users enable row level security;
alter table cycle_data enable row level security;
alter table memory_log enable row level security;

-- Service role bypasses RLS (used by bot via supabaseAdmin)
-- No policies needed for service role access
-- Add policies here later for portal/frontend access

create policy "service_role_users" on users
  for all using (true);

create policy "service_role_cycle_data" on cycle_data
  for all using (true);

create policy "service_role_memory_log" on memory_log
  for all using (true);
