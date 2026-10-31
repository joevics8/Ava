-- Blog for the Ava content site. Public can read published rows only; all
-- writes go through the service-role key (publisher cron / admin scripts).
create table if not exists blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  language text not null default 'en',
  title text not null,
  excerpt text,
  content text not null,
  category text,
  read_time integer,
  faqs jsonb,
  translation_group uuid,
  published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (language, slug)
);

create index if not exists blog_posts_published_idx on blog_posts (language, published_at desc) where published;
create index if not exists blog_posts_draft_queue_idx on blog_posts (language, created_at) where not published;
create index if not exists blog_posts_group_idx on blog_posts (translation_group);

alter table blog_posts enable row level security;
drop policy if exists "public read published posts" on blog_posts;
create policy "public read published posts" on blog_posts for select using (published = true);

create or replace function blog_posts_touch() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists blog_posts_touch on blog_posts;
create trigger blog_posts_touch before update on blog_posts for each row execute function blog_posts_touch();
