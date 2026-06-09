import type { Tables } from "@/types/database";

export type Venue = Tables<"venues">;
export type Visit = Tables<"visits">;
export type PassportStamp = Tables<"passport_stamps">;
export type JournalEntry = Tables<"journal_entries">;

export type VisitWithVenue = Visit & {
  venues: Pick<Venue, "name" | "city" | "country" | "category"> | null;
};
