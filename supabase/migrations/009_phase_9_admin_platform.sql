-- Phase 9 admin platform: roles, moderation status, flags, audit logs, and admin RLS.

alter table public.profiles
  add column if not exists role text not null default 'user' check (role in ('user', 'moderator', 'admin')),
  add column if not exists status text not null default 'active' check (status in ('active', 'suspended')),
  add column if not exists deleted_at timestamptz;

alter table public.venues
  add column if not exists review_status text not null default 'active' check (review_status in ('active', 'hidden', 'pending_review'));

alter table public.journal_entries
  add column if not exists moderation_status text not null default 'active' check (moderation_status in ('active', 'hidden', 'flagged'));

alter table public.journal_comments
  add column if not exists moderation_status text not null default 'active' check (moderation_status in ('active', 'hidden', 'flagged'));

create table if not exists public.moderation_flags (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('user', 'venue', 'journal', 'comment')),
  target_id uuid not null,
  reason text not null,
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  created_by uuid references public.profiles(id) on delete set null,
  resolved_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  target_type text not null,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists profiles_role_status_idx on public.profiles (role, status);
create index if not exists venues_review_status_idx on public.venues (review_status);
create index if not exists journal_entries_moderation_status_idx on public.journal_entries (moderation_status, created_at desc);
create index if not exists journal_comments_moderation_status_idx on public.journal_comments (moderation_status, created_at desc);
create index if not exists moderation_flags_status_idx on public.moderation_flags (status, created_at desc);
create index if not exists audit_logs_created_at_idx on public.audit_logs (created_at desc);

create or replace function public.current_profile_role()
returns text
language sql
security definer
set search_path = public
as $$
  select coalesce((select role from public.profiles where id = auth.uid()), 'user');
$$;

create or replace function public.is_admin_role()
returns boolean
language sql
security definer
set search_path = public
as $$
  select public.current_profile_role() in ('admin', 'moderator');
$$;

alter table public.moderation_flags enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists "Admins can read all profiles" on public.profiles;
create policy "Admins can read all profiles"
on public.profiles for select
using (public.is_admin_role());

drop policy if exists "Admins can update profiles" on public.profiles;
create policy "Admins can update profiles"
on public.profiles for update
using (public.current_profile_role() = 'admin')
with check (public.current_profile_role() = 'admin');

drop policy if exists "Admins can update venues" on public.venues;
create policy "Admins can update venues"
on public.venues for update
using (public.is_admin_role())
with check (public.is_admin_role());

drop policy if exists "Admins can read favorites" on public.favorites;
create policy "Admins can read favorites"
on public.favorites for select
using (public.is_admin_role());

drop policy if exists "Admins can read visits" on public.visits;
create policy "Admins can read visits"
on public.visits for select
using (public.is_admin_role());

drop policy if exists "Admins can read passport stamps" on public.passport_stamps;
create policy "Admins can read passport stamps"
on public.passport_stamps for select
using (public.is_admin_role());

drop policy if exists "Admins can read user achievements" on public.user_achievements;
create policy "Admins can read user achievements"
on public.user_achievements for select
using (public.is_admin_role());

drop policy if exists "Admins can read notifications" on public.notifications;
create policy "Admins can read notifications"
on public.notifications for select
using (public.is_admin_role());

drop policy if exists "Admins can read all journal entries" on public.journal_entries;
create policy "Admins can read all journal entries"
on public.journal_entries for select
using (public.is_admin_role());

drop policy if exists "Admins can update journal entries" on public.journal_entries;
create policy "Admins can update journal entries"
on public.journal_entries for update
using (public.is_admin_role())
with check (public.is_admin_role());

drop policy if exists "Admins can read comments" on public.journal_comments;
create policy "Admins can read comments"
on public.journal_comments for select
using (public.is_admin_role());

drop policy if exists "Admins can update comments" on public.journal_comments;
create policy "Admins can update comments"
on public.journal_comments for update
using (public.is_admin_role())
with check (public.is_admin_role());

drop policy if exists "Admins can delete comments" on public.journal_comments;
create policy "Admins can delete comments"
on public.journal_comments for delete
using (public.is_admin_role());

drop policy if exists "Admins can read moderation flags" on public.moderation_flags;
create policy "Admins can read moderation flags"
on public.moderation_flags for select
using (public.is_admin_role());

drop policy if exists "Admins can write moderation flags" on public.moderation_flags;
create policy "Admins can write moderation flags"
on public.moderation_flags for all
using (public.is_admin_role())
with check (public.is_admin_role());

drop policy if exists "Admins can read audit logs" on public.audit_logs;
create policy "Admins can read audit logs"
on public.audit_logs for select
using (public.is_admin_role());

drop policy if exists "Admins can insert audit logs" on public.audit_logs;
create policy "Admins can insert audit logs"
on public.audit_logs for insert
with check (public.is_admin_role());
