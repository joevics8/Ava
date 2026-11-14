-- Remembers which period start date she has confirmed as current, so the
-- "I may be out of date on your last period" line stops once she has confirmed
-- it. It applies only to that date: logging a newer period makes it irrelevant.
-- Run in the Supabase SQL editor.
alter table public.cycle_data
  add column if not exists last_period_confirmed_for date;
