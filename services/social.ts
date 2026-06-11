import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type PublicProfile = Tables<"profiles"> & {
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
};

export type SocialJournalEntry = Tables<"journal_entries"> & {
  author: Tables<"profiles"> | null;
  commentCount: number;
  comments: Array<Tables<"journal_comments"> & { author: Tables<"profiles"> | null }>;
  likedByViewer: boolean;
  likeCount: number;
  venue: Pick<Tables<"venues">, "name" | "slug" | "city" | "country"> | null;
};

export type FeedVisit = Pick<Tables<"visits">, "id" | "created_at" | "visited_on" | "user_id"> & {
  author: Tables<"profiles"> | null;
  venue: Pick<Tables<"venues">, "name" | "slug" | "city" | "country"> | null;
};

export type SocialNotification = Tables<"notifications"> & {
  actor: Tables<"profiles"> | null;
  entry: Pick<Tables<"journal_entries">, "id" | "title"> | null;
};

type JournalRow = Tables<"journal_entries"> & {
  venues?: SocialJournalEntry["venue"];
};

type VisitRow = Pick<Tables<"visits">, "id" | "created_at" | "visited_on" | "user_id"> & {
  venues?: FeedVisit["venue"];
};

async function getProfilesById(ids: string[]) {
  const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
  if (!uniqueIds.length) return new Map<string, Tables<"profiles">>();

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("profiles").select("*").in("id", uniqueIds);
  return new Map(((data ?? []) as Tables<"profiles">[]).map((profile) => [profile.id, profile]));
}

export async function listPublicProfiles(viewerId: string): Promise<PublicProfile[]> {
  if (!isSupabaseConfigured) return [];

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(24);
  const profiles = (data ?? []) as Tables<"profiles">[];

  return Promise.all(
    profiles.map(async (profile) => {
      const [{ count: followerCount }, { count: followingCount }, { data: follow }] = await Promise.all([
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", profile.id),
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", profile.id),
        supabase.from("follows").select("follower_id").eq("follower_id", viewerId).eq("following_id", profile.id).maybeSingle()
      ]);

      return {
        ...profile,
        followerCount: followerCount ?? 0,
        followingCount: followingCount ?? 0,
        isFollowing: Boolean(follow)
      };
    })
  );
}

export async function getPublicProfile(profileId: string, viewerId: string): Promise<PublicProfile | null> {
  const profiles = await listPublicProfiles(viewerId);
  return profiles.find((profile) => profile.id === profileId) ?? null;
}

export async function listPublicJournalEntries(viewerId: string, filters: { authorId?: string; authorIds?: string[] } = {}): Promise<SocialJournalEntry[]> {
  if (!isSupabaseConfigured) return [];

  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("journal_entries")
    .select("*, venues(name, slug, city, country)")
    .eq("is_private", false)
    .order("entry_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(30);

  if (filters.authorId) query = query.eq("user_id", filters.authorId);
  if (filters.authorIds?.length) query = query.in("user_id", filters.authorIds);

  const { data } = await query;
  const rows = (data ?? []) as JournalRow[];
  const profileMap = await getProfilesById(rows.map((entry) => entry.user_id));

  return Promise.all(
    rows.map(async (entry) => {
      const [{ count: likeCount }, { count: commentCount }, { data: liked }, { data: comments }] = await Promise.all([
        supabase.from("journal_likes").select("*", { count: "exact", head: true }).eq("entry_id", entry.id),
        supabase.from("journal_comments").select("*", { count: "exact", head: true }).eq("entry_id", entry.id),
        supabase.from("journal_likes").select("entry_id").eq("entry_id", entry.id).eq("user_id", viewerId).maybeSingle(),
        supabase.from("journal_comments").select("*").eq("entry_id", entry.id).order("created_at", { ascending: false }).limit(6)
      ]);
      const commentRows = (comments ?? []) as Tables<"journal_comments">[];
      const commentProfiles = await getProfilesById(commentRows.map((comment) => comment.user_id));

      return {
        ...entry,
        author: profileMap.get(entry.user_id) ?? null,
        commentCount: commentCount ?? 0,
        comments: commentRows.map((comment) => ({ ...comment, author: commentProfiles.get(comment.user_id) ?? null })),
        likedByViewer: Boolean(liked),
        likeCount: likeCount ?? 0,
        venue: entry.venues ?? null
      };
    })
  );
}

export async function getPublicJournalEntry(entryId: string, viewerId: string): Promise<SocialJournalEntry | null> {
  const entries = await listPublicJournalEntries(viewerId);
  return entries.find((entry) => entry.id === entryId) ?? null;
}

export async function listFollowedFeed(viewerId: string) {
  if (!isSupabaseConfigured) return { entries: [], visits: [] as FeedVisit[] };

  const supabase = await createSupabaseServerClient();
  const { data: follows } = await supabase.from("follows").select("following_id").eq("follower_id", viewerId);
  const followedIds = ((follows ?? []) as Pick<Tables<"follows">, "following_id">[]).map((follow) => follow.following_id);
  if (!followedIds.length) return { entries: [], visits: [] as FeedVisit[] };

  const entries = await listPublicJournalEntries(viewerId, { authorIds: followedIds });
  const { data: visits } = await supabase
    .from("visits")
    .select("id, created_at, visited_on, user_id, venues(name, slug, city, country)")
    .in("user_id", followedIds)
    .order("created_at", { ascending: false })
    .limit(20);
  const visitRows = (visits ?? []) as VisitRow[];
  const profileMap = await getProfilesById(visitRows.map((visit) => visit.user_id));

  return {
    entries,
    visits: visitRows.map((visit) => ({ ...visit, author: profileMap.get(visit.user_id) ?? null, venue: visit.venues ?? null }))
  };
}

export async function listNotifications(userId: string): Promise<SocialNotification[]> {
  if (!isSupabaseConfigured) return [];

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("notifications")
    .select("*, journal_entries(id, title)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  const rows = (data ?? []) as Array<Tables<"notifications"> & { journal_entries?: Pick<Tables<"journal_entries">, "id" | "title"> | null }>;
  const profileMap = await getProfilesById(rows.map((notification) => notification.actor_id ?? ""));
  return rows.map((notification) => ({
    ...notification,
    actor: notification.actor_id ? profileMap.get(notification.actor_id) ?? null : null,
    entry: notification.journal_entries ?? null
  }));
}
