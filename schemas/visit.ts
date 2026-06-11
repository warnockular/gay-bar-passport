import { z } from "zod";

export const visitSchema = z.object({
  visitedOn: z.string().min(1, "Choose the visit date."),
  rating: z.coerce.number().int().min(1, "Rate the visit from 1 to 5.").max(5, "Rate the visit from 1 to 5."),
  mood: z.enum(["iconic", "intimate", "social", "romantic", "high_energy", "reflective"]).optional().or(z.literal("")),
  privateNotes: z.string().max(2000, "Keep notes under 2,000 characters.").optional()
});

export type VisitValues = z.infer<typeof visitSchema>;
