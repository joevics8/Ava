-- Remedy follow-up loop: remember when we asked, so her plain reply ("it helped") is read as the answer,
-- and stop asking after 3 unanswered check-ins.
alter table public.user_remedies
  add column if not exists follow_up_sent_at timestamptz,
  add column if not exists follow_up_count integer not null default 0;
