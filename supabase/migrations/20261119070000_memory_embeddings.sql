-- Meaning-based search over a user's own memory entries (pgvector).
create extension if not exists vector with schema extensions;

alter table public.memory_log add column if not exists embedding extensions.vector(768);

-- Exact search (no ANN index): rows are filtered by user first, so a scan is fast and never misses a match.
create or replace function public.match_memory(
  p_user uuid,
  p_embedding extensions.vector(768),
  p_after timestamptz,
  p_before timestamptz,
  p_min double precision,
  p_limit integer
)
returns table (
  id uuid, category text, summary text, logged_at timestamptz, event_date date,
  cycle_day integer, detail text, source text, similarity double precision
)
language sql stable security invoker
set search_path = public, extensions
as $$
  select m.id, m.category, m.summary, m.logged_at, m.event_date, m.cycle_day, m.detail, m.source,
         1 - (m.embedding <=> p_embedding) as similarity
  from public.memory_log m
  where m.user_id = p_user
    and m.source = 'user'
    and m.embedding is not null
    and m.logged_at >= p_after
    and m.logged_at < p_before
    and 1 - (m.embedding <=> p_embedding) >= p_min
  order by m.embedding <=> p_embedding
  limit p_limit;
$$;

revoke execute on function public.match_memory(uuid, extensions.vector, timestamptz, timestamptz, double precision, integer) from public, anon, authenticated;
grant execute on function public.match_memory(uuid, extensions.vector, timestamptz, timestamptz, double precision, integer) to service_role;
