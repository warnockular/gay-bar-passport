import { z } from "zod";

// Profile schemas live beside auth schemas so Phase 3 forms and server actions validate the same fields.
export const profileSchema = z.object({
  displayName: z.string().trim().min(2, "Use at least 2 characters.").max(80, "Keep the name under 80 characters."),
  homeCity: z.string().trim().max(120, "Keep the city under 120 characters.").optional()
});

export type ProfileValues = z.infer<typeof profileSchema>;
