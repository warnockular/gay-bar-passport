import type { CanonicalVenueFieldKey, VenueEditorMode } from "@/features/venues/editor/venue-editor-config";

export type VenueEditorValueMap = Partial<Record<CanonicalVenueFieldKey, string | number | null | undefined>>;

export type VenueEditorFieldNameMap = Partial<Record<CanonicalVenueFieldKey, string>>;

export type VenueEditorSectionProps = {
  fieldNames?: VenueEditorFieldNameMap;
  mode: VenueEditorMode;
  values: VenueEditorValueMap;
};

export function fieldName(fieldNames: VenueEditorFieldNameMap | undefined, key: CanonicalVenueFieldKey) {
  return fieldNames?.[key] ?? key;
}

export function fieldValue(values: VenueEditorValueMap, key: CanonicalVenueFieldKey) {
  const value = values[key];
  if (value === null || value === undefined) return "";
  return String(value);
}

export function inputClass() {
  return "h-10 w-full rounded-md border border-input bg-background/80 px-3 text-sm font-normal";
}

export function textareaClass() {
  return "min-h-24 w-full rounded-md border border-input bg-background/80 px-3 py-2 text-sm font-normal";
}

export function EditorField({ children, helpText, label }: { children: React.ReactNode; helpText?: string; label: string }) {
  return (
    <label className="space-y-2 text-sm font-semibold">
      <span>{label}</span>
      {children}
      {helpText ? <span className="block text-xs font-normal leading-5 text-muted-foreground">{helpText}</span> : null}
    </label>
  );
}
