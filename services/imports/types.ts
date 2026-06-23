import type { Database, Json } from "@/types/database";

export type ImportProviderType = "curated_csv" | "google_places" | "openstreetmap" | "wikidata" | string;

export type ImportedVenueCandidate = {
  address?: string | null;
  category?: string | null;
  city?: string | null;
  confidenceScore?: number | null;
  country?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  name?: string | null;
  neighborhood?: string | null;
  openingHours?: string | null;
  phone?: string | null;
  postalCode?: string | null;
  rawData: Record<string, Json | undefined>;
  region?: string | null;
  source: string;
  sourceId?: string | null;
  sourceMetadata?: Record<string, Json | undefined>;
  sourceUrl?: string | null;
  suggestedCategory?: string | null;
  suggestedTags?: string[];
  websiteUrl?: string | null;
};

export type ImportCandidateError = {
  errors: string[];
  row: number;
  values: Record<string, string>;
};

export type ImportAdapterInput = {
  csv?: string;
  rawResults?: unknown[];
  sourceName: string;
  sourceType: ImportProviderType;
};

export type ImportAdapterResult = {
  candidates: ImportedVenueCandidate[];
  invalidCandidates: ImportCandidateError[];
  totalCount: number;
};

export type ImportAdapter = {
  parse(input: ImportAdapterInput): Promise<ImportAdapterResult> | ImportAdapterResult;
  sourceType: ImportProviderType;
};

export type StagedImportResult = {
  batchId?: string;
  error?: string;
};

export type StagingInsert = Database["public"]["Tables"]["venue_import_staging"]["Insert"];
