-- Deleting an account must not be blocked by referrals or payments (it used to fail silently, leaving the profile behind).
-- Referral rows go with either person; the payment record stays (without a link to a person) for accounting.
alter table public.users drop constraint if exists users_referred_by_fkey;
alter table public.users add constraint users_referred_by_fkey foreign key (referred_by) references public.users(id) on delete set null;

alter table public.referrals drop constraint if exists referrals_referrer_id_fkey;
alter table public.referrals add constraint referrals_referrer_id_fkey foreign key (referrer_id) references public.users(id) on delete cascade;
alter table public.referrals drop constraint if exists referrals_referred_id_fkey;
alter table public.referrals add constraint referrals_referred_id_fkey foreign key (referred_id) references public.users(id) on delete cascade;

alter table public.user_payments alter column user_id drop not null;
alter table public.user_payments drop constraint if exists user_payments_user_id_fkey;
alter table public.user_payments add constraint user_payments_user_id_fkey foreign key (user_id) references public.users(id) on delete set null;
