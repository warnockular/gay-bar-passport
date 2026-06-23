import type { ImportAdapter } from "@/services/imports/types";

export const wikidataImportAdapter: ImportAdapter = {
  parse() {
    // TODO: Phase 13E+: map Wikidata entities into canonical imported venue candidates.
    // This placeholder intentionally does not call external APIs.
    return { candidates: [], invalidCandidates: [], totalCount: 0 };
  },
  sourceType: "wikidata"
};
