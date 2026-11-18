-- Memory upgrade: events carry the real date, cycle day, her own words and who said it;
-- lasting facts get their own table.

alter table public.memory_log add column if not exists event_date date;
alter table public.memory_log add column if not exists cycle_day integer;
alter table public.memory_log add column if not exists detail text;           -- her own words (trimmed), user-sourced rows only
alter table public.memory_log add column if not exists source text not null default 'user';
do $$ begin
  alter table public.memory_log add constraint memory_log_source_check check (source in ('user', 'ava'));
exception when duplicate_object then null; end $$;

-- 'chat' and 'insight' rows are Ava's own notes (a summary of the exchange, including
-- her reply), not something the user said.
update public.memory_log set source = 'ava' where category in ('chat', 'insight') and source = 'user';
update public.memory_log set event_date = (logged_at at time zone 'Africa/Lagos')::date where event_date is null;

create index if not exists memory_log_user_event_idx on public.memory_log (user_id, event_date desc);

create table if not exists public.memory_facts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  key text not null,
  value text not null,
  source text not null default 'user' check (source in ('user', 'ava')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, key)
);

alter table public.memory_facts enable row level security;
revoke all on public.memory_facts from anon, authenticated;
