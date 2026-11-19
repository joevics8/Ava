-- Meaning-based matching of a symptom message to a remedy condition (fallback when the keyword matcher finds nothing).
create table if not exists public.condition_embeddings (
  condition text primary key,
  label text not null,
  embedding extensions.vector(768) not null,
  updated_at timestamptz not null default now()
);
alter table public.condition_embeddings enable row level security;
revoke all on public.condition_embeddings from anon, authenticated;

create or replace function public.match_condition(p_embedding extensions.vector(768), p_limit integer)
returns table (condition text, label text, similarity double precision)
language sql stable security invoker
set search_path = public, extensions
as $$
  select c.condition, c.label, 1 - (c.embedding <=> p_embedding) as similarity
  from public.condition_embeddings c
  order by c.embedding <=> p_embedding
  limit p_limit;
$$;
revoke execute on function public.match_condition(extensions.vector, integer) from public, anon, authenticated;
grant execute on function public.match_condition(extensions.vector, integer) to service_role;
