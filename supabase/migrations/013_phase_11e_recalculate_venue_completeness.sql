-- Phase 11E bug fix: recalculate existing venue completeness/readiness rows.
-- The original backfill updated only updated_at, which was not part of the trigger column list.

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
  opening_hours, image_url, identity_classification, verification_status,
  featured, featured_at, updated_at
on public.venues
for each row execute function public.calculate_venue_quality();

update public.venues
set updated_at = now();
