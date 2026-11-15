-- Admin content tools (/admin): blog parser/editor + tool page copy overrides.
-- All changes are additive. Existing blog rows and cron behaviour are unchanged.

-- Blog: SEO meta description kept separate from the excerpt, related tools for
-- internal links, and a review hold so the publish cron never releases a draft
-- a human has not approved. (The cron skips review_hold = true.)
alter table public.blog_posts add column if not exists meta_description text;
alter table public.blog_posts add column if not exists related_tool_ids text[] not null default '{}';
alter table public.blog_posts add column if not exists review_hold boolean not null default false;

-- Tool page copy edited in /admin. One row per tool + language. Any column left
-- null falls back to the copy in lib/tools (code), so deleting a row reverts it.
create table if not exists public.tool_content (
  tool_id text not null,
  language text not null default 'en',
  title text,
  h1 text,
  description text,
  intro text,
  article text,
  faqs jsonb,
  reviewed_by jsonb,
  updated_at timestamptz not null default now(),
  primary key (tool_id, language)
);

alter table public.tool_content enable row level security;

-- Pages read this with the public (anon) client, like blog_posts. All writes go
-- through the service role in /api/admin/* after the admin session is checked.
drop policy if exists "public read tool content" on public.tool_content;
create policy "public read tool content" on public.tool_content for select to public using (true);
grant select on public.tool_content to anon, authenticated;

-- Supabase grants new tables to anon/authenticated by default. Keep this one
-- read-only for them (RLS already blocks writes; this is defence in depth).
revoke insert, update, delete, truncate, references, trigger on public.tool_content from anon, authenticated;
