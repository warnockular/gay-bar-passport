export type CountryOption = {
  cities?: string[];
  code: string;
  name: string;
  regions?: string[];
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
