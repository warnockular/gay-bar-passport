export function normalizeCsvHeader(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

export function parseOptionalNumber(value: string, label: string, errors: string[]) {
  if (!value) return null;
  const number = Number(value);
  if (Number.isNaN(number)) {
    errors.push(`${label} must be numeric.`);
    return null;
  }
  return number;
}

export function parseSuggestedTags(value: string) {
  return value
    .split(/[|;,]/g)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function blankToNull(value: string | null | undefined) {
  return value?.trim() || null;
}
