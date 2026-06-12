-- Phase 11E seed data rollout foundation: venue quality scoring, readiness, featured flags,
-- and future bulk operation placeholders. No venue records are imported or bulk loaded here.

do $$
begin
  create type public.venue_readiness_status as enum (
    'incomplete',
    'review_ready',
    'publish_ready',
    'featured_ready'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.venue_bulk_operation_type as enum (
    'bulk_verification',
    'bulk_classification',
    'bulk_feature'
  );
exception
  when duplicate_object then null;
end $$;

alter table public.venues
  add column if not exists opening_hours text,
  add column if not exists completeness_score integer not null default 0,
  add column if not exists readiness_status public.venue_readiness_status not null default 'incomplete',
  add column if not exists missing_data text[] not null default '{}'::text[],
  add column if not exists featured boolean not null default false,
  add column if not exists featured_at timestamptz;

alter table public.venues
  drop constraint if exists venues_completeness_score_range,
  add constraint venues_completeness_score_range check (completeness_score between 0 and 100);

create table if not exists public.venue_bulk_operation_drafts (
  id uuid primary key default gen_random_uuid(),
  operation_type public.venue_bulk_operation_type not null,
  criteria jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status = 'draft'),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.calculate_venue_quality()
returns trigger
language plpgsql
as $$
declare
  score integer := 0;
  missing text[] := '{}';
  has_coordinates boolean;
  has_photo boolean;
  has_verified_status boolean;
begin
  has_coordinates := new.latitude is not null and new.longitude is not null;
  has_photo := nullif(trim(coalesce(new.image_url, '')), '') is not null;
  has_verified_status := new.verification_status is not null and new.verification_status <> 'unverified';

  if nullif(trim(coalesce(new.name, '')), '') is not null then score := score + 10; else missing := array_append(missing, 'name'); end if;
  if nullif(trim(coalesce(new.address, '')), '') is not null then score := score + 10; else missing := array_append(missing, 'address'); end if;
  if nullif(trim(coalesce(new.city, '')), '') is not null then score := score + 10; else missing := array_append(missing, 'city'); end if;
  if nullif(trim(coalesce(new.country, '')), '') is not null then score := score + 10; else missing := array_append(missing, 'country'); end if;
  if has_coordinates then score := score + 10; else missing := array_append(missing, 'coordinates'); end if;
  if nullif(trim(coalesce(new.description, '')), '') is not null then score := score + 10; else missing := array_append(missing, 'description'); end if;
  if nullif(trim(coalesce(new.website_url, '')), '') is not null then score := score + 10; else missing := array_append(missing, 'website'); end if;
  if nullif(trim(coalesce(new.opening_hours, '')), '') is not null then score := score + 10; else missing := array_append(missing, 'hours'); end if;
  if has_photo then score := score + 10; else missing := array_append(missing, 'photos'); end if;
  if new.identity_classification is not null then score := score + 5; else missing := array_append(missing, 'identity_classification'); end if;
  if has_verified_status then score := score + 5; else missing := array_append(missing, 'verification'); end if;

  new.completeness_score := score;
  new.missing_data := missing;

  if score >= 90 and new.verification_status in ('owner_verified', 'admin_verified') and has_photo then
    new.readiness_status := 'featured_ready';
  elsif score >= 80 and has_verified_status then
    new.readiness_status := 'publish_ready';
  elsif score >= 70 then
    new.readiness_status := 'review_ready';
  else
    new.readiness_status := 'incomplete';
  end if;

  if new.featured = false then
    new.featured_at := null;
  elsif new.featured = true and new.featured_at is null then
    new.featured_at := now();
  end if;

  return new;
end;
$$;

drop trigger if exists venues_quality_before_write on public.venues;
create trigger venues_quality_before_write
before insert or update of
  name, address, city, country, latitude, longitude, description, website_url,
  opening_hours, image_url, identity_classification, verification_status, featured, featured_at
on public.venues
for each row execute function public.calculate_venue_quality();

update public.venues set updated_at = updated_at;

create index if not exists venues_readiness_status_idx on public.venues (readiness_status);
create index if not exists venues_completeness_score_idx on public.venues (completeness_score);
create index if not exists venues_featured_idx on public.venues (featured, featured_at desc);
create index if not exists venue_bulk_operation_drafts_type_idx on public.venue_bulk_operation_drafts (operation_type, created_at desc);

alter table public.venue_bulk_operation_drafts enable row level security;

drop policy if exists "Admins can manage venue bulk operation drafts" on public.venue_bulk_operation_drafts;
create policy "Admins can manage venue bulk operation drafts"
on public.venue_bulk_operation_drafts for all
using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'moderator')))
with check (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'moderator')));
