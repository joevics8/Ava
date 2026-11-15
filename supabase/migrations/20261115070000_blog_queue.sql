-- Raw articles saved from /admin/blog, waiting to be parsed by the hourly cron
-- (/api/cron/process-blog-queue). The cron takes the oldest not_processed row,
-- runs the normal blog parser, saves the result to blog_posts as a held draft
-- and marks the row processed. Service-role only: this holds unpublished text,
-- so anon/authenticated get no access and there are no RLS policies.
create table if not exists public.blog_queue (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  language text not null default 'en',
  status text not null default 'not_processed' check (status in ('not_processed', 'processed')),
  attempts integer not null default 0,   -- the cron gives up on a row after 3 tries
  last_error text,
  note text,                             -- parser warnings, shown in /admin
  post_slug text,                        -- the draft this row became
  created_at timestamptz not null default now(),
  processed_at timestamptz,
  chars integer generated always as (length(content)) stored,
  preview text generated always as (left(content, 160)) stored
);

create index if not exists blog_queue_pending_idx on public.blog_queue (created_at) where status = 'not_processed';

alter table public.blog_queue enable row level security;
revoke all on public.blog_queue from anon, authenticated;
