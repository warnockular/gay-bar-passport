import type { ImportAdapter } from "@/services/imports/types";

export const googlePlacesImportAdapter: ImportAdapter = {
  parse() {
    // TODO: Phase 13E+: map Google Places payloads into canonical imported venue candidates.
    // This placeholder intentionally does not call external APIs.
    return { candidates: [], invalidCandidates: [], totalCount: 0 };
  },
  sourceType: "google_places"
};
