import { z } from "zod";

// Zod schemas keep form validation reusable between React Hook Form and server actions.
export const authFormSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(8, "Use at least 8 characters.")
});

export type AuthFormValues = z.infer<typeof authFormSchema>;
