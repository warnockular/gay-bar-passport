import { z } from "zod";

export const venueSubmissionSchema = z.object({
  address: z.string().trim().min(2, "Enter an address or neighborhood.").max(180, "Keep addresses under 180 characters."),
  category: z.enum(["bar", "club", "lounge", "cafe", "performance", "community"]),
  city: z.string().trim().min(2, "Enter a city.").max(80, "Keep cities under 80 characters."),
  country: z.string().trim().min(2, "Enter a country.").max(80, "Keep countries under 80 characters."),
  description: z.string().trim().min(20, "Add a short description for moderators.").max(1200, "Keep descriptions under 1,200 characters."),
  imageUrl: z.string().trim().url("Enter a valid image URL.").optional().or(z.literal("")),
  name: z.string().trim().min(2, "Enter the venue name.").max(120, "Keep names under 120 characters."),
  neighborhood: z.string().trim().max(120, "Keep neighborhoods under 120 characters.").optional().or(z.literal("")),
  websiteUrl: z.string().trim().url("Enter a valid website URL.").optional().or(z.literal(""))
});

export type VenueSubmissionValues = z.infer<typeof venueSubmissionSchema>;
