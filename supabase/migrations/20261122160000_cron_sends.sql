-- One row per (user, job, local day) actually claimed for sending. Makes hourly crons safe (never twice in a
-- local day, even if two runs overlap) and lets the bot see how many messages in a row went unanswered.
create table if not exists public.cron_sends (
  user_id uuid not null references public.users(id) on delete cascade,
  job text not null,
  local_date date not null,
  created_at timestamptz not null default now(),
  primary key (user_id, job, local_date)
);
alter table public.cron_sends enable row level security;
revoke all on public.cron_sends from anon, authenticated;

-- When she last wrote to Ava; drives the "pause if ignored" cadence.
alter table public.users add column if not exists last_seen_at timestamptz not null default now();
