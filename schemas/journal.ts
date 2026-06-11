import { z } from "zod";

export const journalSchema = z.object({
  title: z.string().trim().min(2, "Give the entry a title.").max(120, "Keep titles under 120 characters."),
  body: z.string().trim().min(1, "Write a note for this entry.").max(8000, "Keep entries under 8,000 characters."),
  entryDate: z.string().min(1, "Choose an entry date."),
  country: z.string().trim().min(1, "Choose or enter a country.").max(80),
  countrySlug: z.string().trim().min(1),
  city: z.string().trim().min(1, "Choose or enter a city.").max(80),
  citySlug: z.string().trim().min(1),
  venueId: z.string().uuid().optional().or(z.literal("")),
  favoriteId: z.string().uuid().optional().or(z.literal("")),
  isPrivate: z.boolean().optional(),
  visitId: z.string().uuid().optional().or(z.literal(""))
});

export type JournalValues = z.infer<typeof journalSchema>;
