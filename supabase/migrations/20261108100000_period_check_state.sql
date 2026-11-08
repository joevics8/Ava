-- State for the daily "is your period out?" check. Run in the Supabase SQL editor.
-- period_check_for            the expected date currently being asked about
-- period_check_last_asked     local date of the most recent question
-- period_check_unanswered     consecutive asked mornings with no Yes/No reply
-- period_check_answered_on    local date of her most recent Yes/No reply
alter table public.cycle_data
  add column if not exists period_check_for date,
  add column if not exists period_check_last_asked date,
  add column if not exists period_check_unanswered integer not null default 0,
  add column if not exists period_check_answered_on date;
