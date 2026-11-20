-- Results of the automatic draft checks (cron). Held drafts that pass are released; failures keep their reasons here.
alter table public.blog_posts
  add column if not exists auto_checked_at timestamptz,
  add column if not exists auto_check_notes text[],
  add column if not exists auto_approved boolean not null default false;
