-- Per-user time zone, so "today", cycle day, greetings and the morning message follow her clock.
alter table public.users
  add column if not exists timezone text not null default 'Africa/Lagos',
  add column if not exists timezone_set_by_user boolean not null default false,
  add column if not exists morning_last_sent_on date,
  add column if not exists affirmation_last_sent_on date;
-- Everyone already got today's messages from the old single-time schedule.
update public.users set morning_last_sent_on = current_date, affirmation_last_sent_on = current_date where morning_last_sent_on is null;
