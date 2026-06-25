import { EditorField, fieldName, fieldValue, inputClass, type VenueEditorSectionProps } from "@/features/venues/editor/venue-editor-fields";
import { venueCategoryOptions } from "@/lib/venue-categories";

export function VenueIdentityFields({ fieldNames, values }: VenueEditorSectionProps) {
  return (
    <section className="grid gap-4 md:grid-cols-2">
      <EditorField label="Venue Name">
        <input className={inputClass()} name={fieldName(fieldNames, "name")} defaultValue={fieldValue(values, "name")} />
      </EditorField>
      <EditorField label="Category">
        <select className={inputClass()} name={fieldName(fieldNames, "category")} defaultValue={fieldValue(values, "category")}>
          <option value="">Choose category</option>
          {venueCategoryOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </EditorField>
    </section>
  );
}
