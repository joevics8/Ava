-- Emails allowed into /admin once they have a confirmed Supabase Auth account (no signup page exists).
create table if not exists public.admin_emails (email text primary key check (email = lower(email)));
alter table public.admin_emails enable row level security;
revoke all on public.admin_emails from anon, authenticated;
insert into public.admin_emails (email) values
 ('joevicstown@gmail.com'),('joevicspro@gmail.com'),('joevicsworld@gmail.com'),
 ('joevicslove@gmail.com'),('joevicsland@gmail.com'),('joevicspay1@gmail.com')
on conflict do nothing;
