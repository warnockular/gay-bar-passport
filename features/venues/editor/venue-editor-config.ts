export type VenueEditorMode = "travelerSubmission" | "adminVenue" | "stagedCandidate";

export type VenueEditorSection = "identity" | "location" | "details" | "metadata";

export type CanonicalVenueFieldKey =
  | "name"
  | "category"
  | "country"
  | "region"
  | "city"
  | "neighborhood"
  | "address"
  | "postal_code"
  | "latitude"
  | "longitude"
  | "website_url"
  | "phone"
  | "opening_hours"
  | "image_url"
  | "description"
  | "confidence_score"
  | "suggested_tags"
  | "traveler_tags"
  | "review_notes"
  | "source"
  | "source_id"
  | "source_url"
  | "verification_status"
  | "review_status"
  | "submission_status"
  | "completeness_score"
  | "readiness_status";

export type VenueEditorFieldConfig = {
  adminEditable: boolean;
  adminOnly: boolean;
  helpText?: string;
  key: CanonicalVenueFieldKey;
  label: string;
  publicFacing: boolean;
  requiredByMode?: Partial<Record<VenueEditorMode, boolean>>;
  section: VenueEditorSection;
  stagedCandidateEditable: boolean;
  travelerEditable: boolean;
};

export const venueEditorFields: VenueEditorFieldConfig[] = [
  {
    adminEditable: true,
    adminOnly: false,
    key: "name",
    label: "Venue Name",
    publicFacing: true,
    requiredByMode: { adminVenue: true, stagedCandidate: true, travelerSubmission: true },
    section: "identity",
    stagedCandidateEditable: true,
    travelerEditable: true
  },
  {
    adminEditable: true,
    adminOnly: false,
    key: "category",
    label: "Category",
    publicFacing: true,
    requiredByMode: { adminVenue: true, stagedCandidate: true, travelerSubmission: true },
    section: "identity",
    stagedCandidateEditable: true,
    travelerEditable: true
  },
  {
    adminEditable: true,
    adminOnly: false,
    key: "country",
    label: "Country",
    publicFacing: true,
    requiredByMode: { adminVenue: true, stagedCandidate: true, travelerSubmission: true },
    section: "location",
    stagedCandidateEditable: true,
    travelerEditable: true
  },
  {
    adminEditable: true,
    adminOnly: false,
    helpText: "Required for countries with configured state, province, or territory options.",
    key: "region",
    label: "State / Province / Territory",
    publicFacing: true,
    requiredByMode: { travelerSubmission: true },
    section: "location",
    stagedCandidateEditable: true,
    travelerEditable: true
  },
  {
    adminEditable: true,
    adminOnly: false,
    key: "city",
    label: "City",
    publicFacing: true,
    requiredByMode: { adminVenue: true, stagedCandidate: true, travelerSubmission: true },
    section: "location",
    stagedCandidateEditable: true,
    travelerEditable: true
  },
  {
    adminEditable: true,
    adminOnly: false,
    helpText: "Useful for NYC, Montreal, and other neighborhood-driven browsing.",
    key: "neighborhood",
    label: "Neighborhood",
    publicFacing: true,
    section: "location",
    stagedCandidateEditable: true,
    travelerEditable: true
  },
  {
    adminEditable: true,
    adminOnly: false,
    helpText: "Use the street address when available.",
    key: "address",
    label: "Street Address",
    publicFacing: true,
    section: "location",
    stagedCandidateEditable: true,
    travelerEditable: true
  },
  {
    adminEditable: true,
    adminOnly: false,
    key: "postal_code",
    label: "Postal Code",
    publicFacing: true,
    section: "location",
    stagedCandidateEditable: true,
    travelerEditable: false
  },
  {
    adminEditable: true,
    adminOnly: true,
    helpText: "Powers directions and future maps.",
    key: "latitude",
    label: "Latitude",
    publicFacing: false,
    section: "location",
    stagedCandidateEditable: true,
    travelerEditable: false
  },
  {
    adminEditable: true,
    adminOnly: true,
    helpText: "Powers directions and future maps.",
    key: "longitude",
    label: "Longitude",
    publicFacing: false,
    section: "location",
    stagedCandidateEditable: true,
    travelerEditable: false
  },
  {
    adminEditable: true,
    adminOnly: false,
    key: "website_url",
    label: "Website URL",
    publicFacing: true,
    section: "details",
    stagedCandidateEditable: true,
    travelerEditable: true
  },
  {
    adminEditable: true,
    adminOnly: false,
    key: "phone",
    label: "Phone",
    publicFacing: true,
    section: "details",
    stagedCandidateEditable: true,
    travelerEditable: false
  },
  {
    adminEditable: true,
    adminOnly: false,
    key: "opening_hours",
    label: "Business Hours",
    publicFacing: true,
    section: "details",
    stagedCandidateEditable: true,
    travelerEditable: false
  },
  {
    adminEditable: true,
    adminOnly: false,
    key: "image_url",
    label: "Image URL",
    publicFacing: true,
    section: "details",
    stagedCandidateEditable: true,
    travelerEditable: true
  },
  {
    adminEditable: true,
    adminOnly: false,
    helpText: "Describe what travelers can expect.",
    key: "description",
    label: "Description",
    publicFacing: true,
    requiredByMode: { travelerSubmission: true },
    section: "details",
    stagedCandidateEditable: true,
    travelerEditable: true
  },
  {
    adminEditable: true,
    adminOnly: true,
    key: "confidence_score",
    label: "Confidence Score",
    publicFacing: false,
    section: "metadata",
    stagedCandidateEditable: true,
    travelerEditable: false
  },
  {
    adminEditable: true,
    adminOnly: true,
    key: "suggested_tags",
    label: "Suggested Tags",
    publicFacing: false,
    section: "metadata",
    stagedCandidateEditable: true,
    travelerEditable: false
  },
  {
    adminEditable: true,
    adminOnly: false,
    key: "traveler_tags",
    label: "Traveler Tags",
    publicFacing: true,
    section: "metadata",
    stagedCandidateEditable: false,
    travelerEditable: false
  },
  {
    adminEditable: true,
    adminOnly: true,
    key: "review_notes",
    label: "Internal Notes",
    publicFacing: false,
    section: "metadata",
    stagedCandidateEditable: true,
    travelerEditable: false
  },
  {
    adminEditable: true,
    adminOnly: true,
    key: "source",
    label: "Source",
    publicFacing: false,
    section: "metadata",
    stagedCandidateEditable: false,
    travelerEditable: false
  },
  {
    adminEditable: true,
    adminOnly: true,
    key: "source_id",
    label: "Source ID",
    publicFacing: false,
    section: "metadata",
    stagedCandidateEditable: false,
    travelerEditable: false
  },
  {
    adminEditable: false,
    adminOnly: true,
    key: "source_url",
    label: "Source URL",
    publicFacing: false,
    section: "metadata",
    stagedCandidateEditable: false,
    travelerEditable: false
  },
  {
    adminEditable: true,
    adminOnly: true,
    key: "verification_status",
    label: "Verification",
    publicFacing: true,
    section: "metadata",
    stagedCandidateEditable: false,
    travelerEditable: false
  },
  {
    adminEditable: true,
    adminOnly: true,
    key: "review_status",
    label: "Review Status",
    publicFacing: false,
    section: "metadata",
    stagedCandidateEditable: false,
    travelerEditable: false
  },
  {
    adminEditable: true,
    adminOnly: true,
    key: "submission_status",
    label: "Submission Status",
    publicFacing: false,
    section: "metadata",
    stagedCandidateEditable: false,
    travelerEditable: false
  },
  {
    adminEditable: false,
    adminOnly: true,
    key: "completeness_score",
    label: "Completeness Score",
    publicFacing: false,
    section: "metadata",
    stagedCandidateEditable: false,
    travelerEditable: false
  },
  {
    adminEditable: false,
    adminOnly: true,
    key: "readiness_status",
    label: "Readiness Status",
    publicFacing: false,
    section: "metadata",
    stagedCandidateEditable: false,
    travelerEditable: false
  }
];

export function venueEditorField(key: CanonicalVenueFieldKey) {
  return venueEditorFields.find((field) => field.key === key);
}

export function venueEditorFieldsForSection(section: VenueEditorSection) {
  return venueEditorFields.filter((field) => field.section === section);
}

export function isVenueFieldRequired(key: CanonicalVenueFieldKey, mode: VenueEditorMode) {
  return Boolean(venueEditorField(key)?.requiredByMode?.[mode]);
}
