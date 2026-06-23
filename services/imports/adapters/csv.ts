import { venueCategoryValues } from "@/lib/venue-categories";
import { blankToNull, normalizeCsvHeader, parseOptionalNumber, parseSuggestedTags } from "@/services/imports/normalizers";
import type { ImportAdapter, ImportAdapterResult, ImportCandidateError } from "@/services/imports/types";
import type { Database } from "@/types/database";

function parseCsvRows(csv: string) {
  const rows: string[][] = [];
  let current = "";
  let row: string[] = [];
  let quoted = false;

  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];
    const next = csv[index + 1];

    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(current.trim());
      current = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(current.trim());
      if (row.some((cell) => cell.length > 0)) rows.push(row);
      row = [];
      current = "";
    } else {
      current += char;
    }
  }

  row.push(current.trim());
  if (row.some((cell) => cell.length > 0)) rows.push(row);
  return rows;
}

function parseCsvObjects(csv: string) {
  const rows = parseCsvRows(csv);
  if (rows.length < 2) return [];
  const headers = rows[0].map(normalizeCsvHeader);
  return rows.slice(1).map((cells, index) => ({
    rowNumber: index + 2,
    values: Object.fromEntries(headers.map((header, cellIndex) => [header, cells[cellIndex]?.trim() ?? ""]))
  }));
}

function categoryFromCsv(value: string) {
  const normalized = normalizeCsvHeader(value);
  return venueCategoryValues.includes(normalized as never) ? normalized as Database["public"]["Enums"]["venue_category"] : null;
}

export const csvImportAdapter: ImportAdapter = {
  parse(input): ImportAdapterResult {
    const rows = parseCsvObjects(input.csv ?? "");
    const invalidCandidates: ImportCandidateError[] = [];
    const candidates = rows.flatMap((row) => {
      const values = row.values;
      const errors: string[] = [];
      const name = values.name?.trim() ?? "";
      const city = values.city?.trim() ?? "";
      const country = values.country?.trim() ?? "";
      const latitude = parseOptionalNumber(values.latitude ?? "", "Latitude", errors);
      const longitude = parseOptionalNumber(values.longitude ?? "", "Longitude", errors);
      const confidenceScore = parseOptionalNumber(values.confidence_score ?? "", "Confidence score", errors);
      const suggestedCategory = categoryFromCsv(values.category ?? "");

      if (!name) errors.push("Name is required.");
      if (!city) errors.push("City is required.");
      if (!country) errors.push("Country is required.");
      if (confidenceScore !== null && (confidenceScore < 0 || confidenceScore > 100)) errors.push("Confidence score must be between 0 and 100.");

      if (errors.length) {
        invalidCandidates.push({ errors, row: row.rowNumber, values });
        return [];
      }

      const rowSource = values.source?.trim() || input.sourceType;
      return [{
        address: blankToNull(values.address),
        category: blankToNull(values.category),
        city,
        confidenceScore,
        country,
        description: blankToNull(values.description),
        imageUrl: blankToNull(values.image_url),
        latitude,
        longitude,
        name,
        neighborhood: blankToNull(values.neighborhood),
        openingHours: blankToNull(values.opening_hours),
        phone: blankToNull(values.phone),
        postalCode: blankToNull(values.postal_code),
        rawData: values,
        region: blankToNull(values.region),
        source: rowSource,
        sourceId: blankToNull(values.source_id),
        sourceMetadata: {
          address: blankToNull(values.address),
          category: blankToNull(values.category),
          description: blankToNull(values.description),
          image_url: blankToNull(values.image_url),
          imported_via: "curated_csv",
          neighborhood: blankToNull(values.neighborhood),
          opening_hours: blankToNull(values.opening_hours),
          region: blankToNull(values.region),
          source_name: input.sourceName,
          source_type: input.sourceType,
          website_url: blankToNull(values.website_url)
        },
        sourceUrl: blankToNull(values.source_url),
        suggestedCategory: suggestedCategory ?? blankToNull(values.category),
        suggestedTags: parseSuggestedTags(values.suggested_tags ?? ""),
        websiteUrl: blankToNull(values.website_url)
      }];
    });

    return { candidates, invalidCandidates, totalCount: rows.length };
  },
  sourceType: "curated_csv"
};
