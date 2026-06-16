import { z } from "zod";
import { countryHasConfiguredRegions, countryOptions, getCountryOption } from "@/lib/location-options";
import { venueCategoryValues } from "@/lib/venue-categories";

export const venueSubmissionSchema = z.object({
  address: z.string().trim().max(180, "Keep addresses under 180 characters.").optional().or(z.literal("")),
  category: z.enum(venueCategoryValues as [string, ...string[]]),
  city: z.string().trim().min(2, "Enter a city.").max(80, "Keep cities under 80 characters."),
  country: z.string().trim().min(2, "Choose a country.").refine((country) => countryOptions.some((option) => option.name === country), "Choose a supported country."),
  description: z.string().trim().min(20, "Add a short description for moderators.").max(1200, "Keep descriptions under 1,200 characters."),
  imageUrl: z.string().trim().url("Enter a valid image URL.").optional().or(z.literal("")),
  name: z.string().trim().min(2, "Enter the venue name.").max(120, "Keep names under 120 characters."),
  neighborhood: z.string().trim().max(120, "Keep neighborhoods under 120 characters.").optional().or(z.literal("")),
  region: z.string().trim().max(120, "Keep states, provinces, or territories under 120 characters.").optional().or(z.literal("")),
  websiteUrl: z.string().trim().url("Enter a valid website URL.").optional().or(z.literal(""))
}).superRefine((values, context) => {
  if (!values.address && !values.neighborhood) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Add either a street address or neighborhood.",
      path: ["address"]
    });
  }

  if (countryHasConfiguredRegions(values.country) && !values.region) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Choose a state, province, or territory.",
      path: ["region"]
    });
  }

  const country = getCountryOption(values.country);
  if (country?.regions?.length && values.region && !country.regions.includes(values.region)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Choose a supported state, province, or territory.",
      path: ["region"]
    });
  }
});

export type VenueSubmissionValues = z.infer<typeof venueSubmissionSchema>;
