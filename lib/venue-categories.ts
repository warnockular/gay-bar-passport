import type { Enums } from "@/types/database";

export const venueCategoryOptions: Array<{ label: string; value: Enums<"venue_category"> }> = [
  { label: "Bar", value: "bar" },
  { label: "Club", value: "club" },
  { label: "Lounge", value: "lounge" },
  { label: "Cafe", value: "cafe" },
  { label: "Performance", value: "performance" },
  { label: "Community", value: "community" },
  { label: "Strip Club", value: "strip_club" }
];

// Future: move venue types and traveler tags into admin-only taxonomy management.
export const venueCategoryValues = venueCategoryOptions.map((category) => category.value);

export function venueCategoryLabel(value: string) {
  return venueCategoryOptions.find((category) => category.value === value)?.label
    ?? value
      .split("_")
      .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
      .join(" ");
}
