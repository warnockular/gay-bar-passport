import { EditorField, fieldName, fieldValue, inputClass, textareaClass, type VenueEditorSectionProps } from "@/features/venues/editor/venue-editor-fields";

export function VenueMetadataFields({ fieldNames, mode, values }: VenueEditorSectionProps) {
  const showAdminMetadata = mode !== "travelerSubmission";

  if (!showAdminMetadata) return null;

  return (
    <section className="grid gap-4 md:grid-cols-2">
      <EditorField label="Confidence Score">
        <input className={inputClass()} name={fieldName(fieldNames, "confidence_score")} defaultValue={fieldValue(values, "confidence_score")} inputMode="numeric" />
      </EditorField>
      <EditorField label="Suggested Tags" helpText="Comma-separated tag suggestions from imports or admin cleanup.">
        <textarea className={textareaClass()} name={fieldName(fieldNames, "suggested_tags")} defaultValue={fieldValue(values, "suggested_tags")} />
      </EditorField>
      <div className="md:col-span-2">
        <EditorField label="Internal Notes">
          <textarea className={textareaClass()} name={fieldName(fieldNames, "review_notes")} defaultValue={fieldValue(values, "review_notes")} />
        </EditorField>
      </div>
    </section>
  );
}
