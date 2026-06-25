import { EditorField, fieldName, fieldValue, inputClass, textareaClass, type VenueEditorSectionProps } from "@/features/venues/editor/venue-editor-fields";

export function VenueDetailsFields({ fieldNames, values }: VenueEditorSectionProps) {
  return (
    <section className="grid gap-4 md:grid-cols-2">
      <EditorField label="Website URL">
        <input className={inputClass()} name={fieldName(fieldNames, "website_url")} defaultValue={fieldValue(values, "website_url")} />
      </EditorField>
      <EditorField label="Phone">
        <input className={inputClass()} name={fieldName(fieldNames, "phone")} defaultValue={fieldValue(values, "phone")} />
      </EditorField>
      <EditorField label="Image URL">
        <input className={inputClass()} name={fieldName(fieldNames, "image_url")} defaultValue={fieldValue(values, "image_url")} />
      </EditorField>
      <EditorField label="Business Hours">
        <textarea className={textareaClass()} name={fieldName(fieldNames, "opening_hours")} defaultValue={fieldValue(values, "opening_hours")} />
      </EditorField>
      <div className="md:col-span-2">
        <EditorField label="Description" helpText="Describe what travelers can expect.">
          <textarea className={textareaClass()} name={fieldName(fieldNames, "description")} defaultValue={fieldValue(values, "description")} />
        </EditorField>
      </div>
    </section>
  );
}
