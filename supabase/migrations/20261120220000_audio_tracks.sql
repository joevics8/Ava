-- Audio library for meditation, sleep and daily motivation. Tracks are added in /admin/audio (a public URL,
-- e.g. a file in the "audio" storage bucket). Until a track exists the bot falls back to text.
create table if not exists public.audio_tracks (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('meditation', 'sleep', 'motivation')),
  purpose text,                      -- meditation purpose key (morning, stress, sleep...); null for sleep/motivation
  title text not null,
  duration_seconds integer,
  audio_url text,
  telegram_file_id text,             -- cached after the first send; makes later sends instant
  active boolean not null default true,
  created_at timestamptz not null default now(),
  check (audio_url is not null or telegram_file_id is not null)
);
create index if not exists audio_tracks_kind_idx on public.audio_tracks (kind, purpose) where active;
alter table public.audio_tracks enable row level security;
revoke all on public.audio_tracks from anon, authenticated;

insert into storage.buckets (id, name, public) values ('audio', 'audio', true) on conflict (id) do nothing;
