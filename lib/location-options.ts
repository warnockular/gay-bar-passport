export type CountryOption = {
  cities?: string[];
  code: string;
  name: string;
  regions?: string[];
};

export const cityOptionsByCountryRegion: Record<string, Record<string, string[]>> = {
  Canada: {
    "British Columbia": ["Vancouver", "Victoria", "Kelowna"],
    Ontario: ["Toronto", "Ottawa", "Hamilton", "London"],
    Quebec: ["Montreal", "Quebec City", "Gatineau", "Sherbrooke"]
  },
  "United States": {
    California: ["Los Angeles", "San Francisco", "San Diego", "Palm Springs", "Oakland", "Sacramento"],
    "District of Columbia": ["Washington"],
    Florida: ["Miami", "Fort Lauderdale", "Orlando", "Tampa", "Key West"],
    Illinois: ["Chicago", "Springfield", "Evanston"],
    "New York": ["New York City", "Albany", "Syracuse", "Yonkers", "Fire Island", "Rochester", "Buffalo"]
  }
};

export const neighborhoodOptionsByCity: Record<string, string[]> = {
  "New York City": [
    "Hell's Kitchen",
    "West Village",
    "East Village",
    "Chelsea",
    "Harlem",
    "Williamsburg",
    "Bushwick",
    "Jackson Heights",
    "Astoria",
    "Fire Island Pines",
    "Cherry Grove"
  ]
};

export const countryOptions: CountryOption[] = [
  {
    cities: ["New York", "Los Angeles", "San Francisco", "Chicago", "Washington"],
    code: "US",
    name: "United States",
    regions: [
      "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware",
      "District of Columbia", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
      "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota",
      "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey",
      "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon",
      "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah",
      "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
    ]
  },
  {
    cities: ["Montreal", "Toronto", "Vancouver"],
    code: "CA",
    name: "Canada",
    regions: [
      "Alberta", "British Columbia", "Manitoba", "New Brunswick", "Newfoundland and Labrador",
      "Northwest Territories", "Nova Scotia", "Nunavut", "Ontario", "Prince Edward Island", "Quebec",
      "Saskatchewan", "Yukon"
    ]
  },
  { code: "GB", name: "United Kingdom" },
  { code: "FR", name: "France" },
  { code: "DE", name: "Germany" },
  { code: "ES", name: "Spain" },
  { code: "PT", name: "Portugal" },
  { code: "MX", name: "Mexico" },
  { code: "AU", name: "Australia" }
];

export function getCountryOption(country: string) {
  return countryOptions.find((option) => option.name === country || option.code === country);
}

export function countryHasConfiguredRegions(country: string) {
  return Boolean(getCountryOption(country)?.regions?.length);
}

export function getCityOptions(country: string, region: string) {
  return cityOptionsByCountryRegion[country]?.[region] ?? getCountryOption(country)?.cities ?? [];
}

export function getNeighborhoodOptions(city: string) {
  return neighborhoodOptionsByCity[city] ?? [];
}
