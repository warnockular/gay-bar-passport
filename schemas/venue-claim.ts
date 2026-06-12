import { z } from "zod";

export const venueClaimSchema = z.object({
  claimantEmail: z.string().trim().email("Enter a business email address.").max(160, "Keep email under 160 characters."),
  claimantName: z.string().trim().min(2, "Enter your name.").max(120, "Keep names under 120 characters."),
  evidenceUrl: z.string().trim().url("Enter a valid URL.").optional().or(z.literal("")),
  notes: z.string().trim().min(20, "Add a short explanation for the admin team.").max(1200, "Keep notes under 1,200 characters."),
  roleTitle: z.string().trim().min(2, "Enter your role at the venue.").max(120, "Keep roles under 120 characters.")
});

export type VenueClaimValues = z.infer<typeof venueClaimSchema>;
