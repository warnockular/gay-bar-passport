import { csvImportAdapter } from "@/services/imports/adapters/csv";
import { googlePlacesImportAdapter } from "@/services/imports/adapters/google-places";
import { openStreetMapImportAdapter } from "@/services/imports/adapters/openstreetmap";
import { wikidataImportAdapter } from "@/services/imports/adapters/wikidata";
import type { ImportAdapter, ImportAdapterInput, ImportedVenueCandidate, StagedImportResult, StagingInsert } from "@/services/imports/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const adapters: ImportAdapter[] = [
  csvImportAdapter,
  googlePlacesImportAdapter,
  openStreetMapImportAdapter,
  wikidataImportAdapter
];

function getAdapter(sourceType: string) {
  return adapters.find((adapter) => adapter.sourceType === sourceType) ?? csvImportAdapter;
}

function auditActionForSource(sourceType: string) {
  if (sourceType === "google_places") return "google_places_import_staged";
  if (sourceType === "openstreetmap") return "openstreetmap_import_staged";
  if (sourceType === "wikidata") return "wikidata_import_staged";
  return "curated_csv_import_staged";
}

function validateCandidate(candidate: ImportedVenueCandidate, row: number) {
  const errors: string[] = [];
  if (!candidate.name?.trim()) errors.push("Name is required.");
  if (!candidate.city?.trim()) errors.push("City is required.");
  if (!candidate.country?.trim()) errors.push("Country is required.");
  if (candidate.confidenceScore !== null && candidate.confidenceScore !== undefined && (candidate.confidenceScore < 0 || candidate.confidenceScore > 100)) {
    errors.push("Confidence score must be between 0 and 100.");
  }
  return errors.length ? { errors, row, values: Object.fromEntries(Object.entries(candidate.rawData).map(([key, value]) => [key, String(value ?? "")])) } : null;
}

function toStagingRow(candidate: ImportedVenueCandidate, importBatchId: string): StagingInsert {
  return {
    address_components: {
      address: candidate.address ?? null,
      city: candidate.city ?? null,
      country: candidate.country ?? null,
      neighborhood: candidate.neighborhood ?? null,
      postal_code: candidate.postalCode ?? null,
      region: candidate.region ?? null
    },
    city: candidate.city ?? null,
    confidence_score: candidate.confidenceScore ?? null,
    country: candidate.country ?? null,
    import_batch_id: importBatchId,
    last_seen_at: new Date().toISOString(),
    latitude: candidate.latitude ?? null,
    longitude: candidate.longitude ?? null,
    name: candidate.name ?? null,
    phone: candidate.phone ?? null,
    postal_code: candidate.postalCode ?? null,
    raw_data: candidate.rawData,
    review_notes: candidate.description ? `Imported description: ${candidate.description}` : null,
    source: candidate.source,
    source_id: candidate.sourceId ?? null,
    source_metadata: candidate.sourceMetadata ?? {},
    source_url: candidate.sourceUrl ?? null,
    suggested_category: candidate.suggestedCategory ?? candidate.category ?? null,
    suggested_tags: candidate.suggestedTags ?? []
  };
}

export async function stageImportedVenueCandidates(input: ImportAdapterInput & { createdBy: string }): Promise<StagedImportResult> {
  const adapter = getAdapter(input.sourceType);
  const parsed = await adapter.parse(input);
  const validationErrors = parsed.candidates
    .map((candidate, index) => validateCandidate(candidate, index + 1))
    .filter((error): error is NonNullable<typeof error> => Boolean(error));
  const invalidCandidates = [...parsed.invalidCandidates, ...validationErrors];
  const validCandidates = parsed.candidates.filter((candidate, index) => !validateCandidate(candidate, index + 1));
  const supabase = await createSupabaseServerClient();
  const startedAt = new Date().toISOString();

  const { data: batchData, error: batchError } = await supabase
    .from("import_batches")
    .insert({
      completed_at: startedAt,
      created_by: input.createdBy,
      error_details: invalidCandidates,
      imported_count: 0,
      invalid_count: invalidCandidates.length,
      rejected_count: invalidCandidates.length,
      source_name: input.sourceName,
      source_type: input.sourceType,
      staged_count: validCandidates.length,
      started_at: startedAt,
      status: "completed",
      total_count: parsed.totalCount
    } as never)
    .select("id")
    .single();

  if (batchError || !batchData) {
    return { error: batchError?.message ?? "batch-create-failed" };
  }

  const batch = batchData as { id: string };
  const rowsForInsert = validCandidates.map((candidate) => toStagingRow(candidate, batch.id));

  if (rowsForInsert.length) {
    const { error: stagingError } = await supabase.from("venue_import_staging").insert(rowsForInsert as never);
    if (stagingError) {
      await supabase
        .from("import_batches")
        .update({
          completed_at: new Date().toISOString(),
          error_details: [{ errors: [`Staging insert failed: ${stagingError.message}`], row: 0, values: {} }, ...invalidCandidates],
          invalid_count: invalidCandidates.length,
          staged_count: 0,
          status: "failed"
        } as never)
        .eq("id", batch.id);
      return { batchId: batch.id, error: stagingError.message };
    }
  }

  await supabase
    .from("import_batches")
    .update({
      imported_count: rowsForInsert.length,
      staged_count: rowsForInsert.length
    } as never)
    .eq("id", batch.id);

  await supabase.from("audit_logs").insert({
    action: auditActionForSource(input.sourceType),
    actor_id: input.createdBy,
    metadata: {
      invalidRows: String(invalidCandidates.length),
      sourceName: input.sourceName,
      sourceType: input.sourceType,
      stagedRows: String(rowsForInsert.length),
      totalRows: String(parsed.totalCount)
    },
    target_id: batch.id,
    target_type: "import_batch"
  } as never);

  return { batchId: batch.id };
}
