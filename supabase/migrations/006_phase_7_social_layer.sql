-- Phase 7 social layer: follows, public journal interaction, notifications, and feed support.

create table if not exists public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint follows_no_self_follow check (follower_id <> following_id)
);

create table if not exists public.journal_likes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  entry_id uuid not null references public.journal_entries(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, entry_id)
);

create table if not exists public.journal_comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  entry_id uuid not null references public.journal_entries(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  type text not null check (type in ('new_follower', 'new_like', 'new_comment')),
  journal_entry_id uuid references public.journal_entries(id) on delete cascade,
  comment_id uuid references public.journal_comments(id) on delete cascade,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists follows_following_idx on public.follows (following_id, created_at desc);
create index if not exists journal_likes_entry_idx on public.journal_likes (entry_id, created_at desc);
create index if not exists journal_comments_entry_idx on public.journal_comments (entry_id, created_at desc);
create index if not exists notifications_user_idx on public.notifications (user_id, read_at, created_at desc);
create index if not exists journal_entries_public_feed_idx on public.journal_entries (is_private, entry_date desc, created_at desc);

alter table public.follows enable row level security;
alter table public.journal_likes enable row level security;
alter table public.journal_comments enable row level security;
alter table public.notifications enable row level security;

drop policy if exists "Follows are readable by signed in users" on public.follows;
create policy "Follows are readable by signed in users"
on public.follows for select
using (auth.uid() is not null);

drop policy if exists "Users can follow other profiles" on public.follows;
create policy "Users can follow other profiles"
on public.follows for insert
with check (auth.uid() = follower_id);

drop policy if exists "Users can unfollow profiles" on public.follows;
create policy "Users can unfollow profiles"
on public.follows for delete
using (auth.uid() = follower_id);

drop policy if exists "Public journal likes are readable" on public.journal_likes;
create policy "Public journal likes are readable"
on public.journal_likes for select
using (
  exists (
    select 1 from public.journal_entries entry
    where entry.id = entry_id and (entry.is_private = false or entry.user_id = auth.uid())
  )
);

drop policy if exists "Users can like public journal entries" on public.journal_likes;
create policy "Users can like public journal entries"
on public.journal_likes for insert
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.journal_entries entry
    where entry.id = entry_id and entry.is_private = false and entry.user_id <> auth.uid()
  )
);

drop policy if exists "Users can unlike journal entries" on public.journal_likes;
create policy "Users can unlike journal entries"
on public.journal_likes for delete
using (auth.uid() = user_id);

drop policy if exists "Public journal comments are readable" on public.journal_comments;
create policy "Public journal comments are readable"
on public.journal_comments for select
using (
  exists (
    select 1 from public.journal_entries entry
    where entry.id = entry_id and (entry.is_private = false or entry.user_id = auth.uid())
  )
);

drop policy if exists "Users can comment on public journal entries" on public.journal_comments;
create policy "Users can comment on public journal entries"
on public.journal_comments for insert
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.journal_entries entry
    where entry.id = entry_id and entry.is_private = false
  )
);

drop policy if exists "Users can delete own comments" on public.journal_comments;
create policy "Users can delete own comments"
on public.journal_comments for delete
using (auth.uid() = user_id);

drop policy if exists "Notifications are readable by recipient" on public.notifications;
create policy "Notifications are readable by recipient"
on public.notifications for select
using (auth.uid() = user_id);

drop policy if exists "Notifications are insertable by actor" on public.notifications;
create policy "Notifications are insertable by actor"
on public.notifications for insert
with check (auth.uid() = actor_id);

drop policy if exists "Notifications are updatable by recipient" on public.notifications;
create policy "Notifications are updatable by recipient"
on public.notifications for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
