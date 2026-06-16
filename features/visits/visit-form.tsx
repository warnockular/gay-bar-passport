"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, Save, Stamp, X } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { createVisit, updateVisit, type VisitActionResult } from "@/features/visits/actions";
import { visitSchema, type VisitValues } from "@/schemas/visit";
import type { PassportVisit } from "@/services/visits";
import type { Tables } from "@/types/database";

type VisitFormProps = {
  mode: "create" | "edit";
  venue?: Pick<Tables<"venues">, "id" | "name" | "slug">;
  visit?: PassportVisit;
};

const moodOptions = [
  ["", "Choose a mood"],
  ["iconic", "Iconic"],
  ["intimate", "Intimate"],
  ["social", "Social"],
  ["romantic", "Romantic"],
  ["high_energy", "High energy"],
  ["reflective", "Reflective"]
];

const maxPhotoBytes = 4 * 1024 * 1024;
const photoSizeError = "This photo is too large. Please choose an image under 4 MB.";

type SelectedPhoto = {
  file: File;
  id: string;
  previewUrl: string;
};

function formatFileSize(size: number) {
  if (size < 1024 * 1024) return `${Math.max(Math.round(size / 1024), 1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function VisitForm({ mode, venue, visit }: VisitFormProps) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<VisitActionResult | null>(null);
  const [selectedPhotos, setSelectedPhotos] = useState<SelectedPhoto[]>([]);
  const selectedPhotosRef = useRef<SelectedPhoto[]>([]);
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<VisitValues>({
    resolver: zodResolver(visitSchema),
    defaultValues: {
      mood: visit?.mood ?? "",
      privateNotes: visit?.private_notes ?? "",
      rating: visit?.rating ?? 5,
      visitedOn: visit?.visited_on ?? new Date().toISOString().slice(0, 10)
    }
  });
  const hasInvalidPhotos = selectedPhotos.some((photo) => photo.file.size > maxPhotoBytes || !photo.file.type.startsWith("image/"));

  useEffect(() => {
    selectedPhotosRef.current = selectedPhotos;
  }, [selectedPhotos]);

  useEffect(() => () => {
    selectedPhotosRef.current.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
  }, []);

  function addSelectedPhotos(files: FileList | null) {
    const nextPhotos = Array.from(files ?? []).filter((file) => file.type.startsWith("image/"));
    if (!nextPhotos.length) return;
    setResult(null);
    setSelectedPhotos((current) => [
      ...current,
      ...nextPhotos.map((file) => ({
        file,
        id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
        previewUrl: URL.createObjectURL(file)
      }))
    ]);
  }

  function removeSelectedPhoto(photoId: string) {
    setSelectedPhotos((current) => {
      const photo = current.find((item) => item.id === photoId);
      if (photo) URL.revokeObjectURL(photo.previewUrl);
      return current.filter((item) => item.id !== photoId);
    });
  }

  function onSubmit(values: VisitValues) {
    if (hasInvalidPhotos) {
      setResult({ ok: false, message: photoSizeError });
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set("visitedOn", values.visitedOn);
      formData.set("rating", String(values.rating));
      formData.set("mood", values.mood ?? "");
      formData.set("privateNotes", values.privateNotes ?? "");

      selectedPhotos.forEach((photo) => formData.append("photos", photo.file));

      const actionResult =
        mode === "create" && venue ? await createVisit(venue.id, venue.slug, formData) : visit ? await updateVisit(visit.id, formData) : { ok: false, message: "Visit details are missing." };

      setResult(actionResult);
    });
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="visitedOn">Visit date</Label>
          <Input id="visitedOn" type="date" aria-invalid={Boolean(errors.visitedOn)} {...register("visitedOn")} />
          {errors.visitedOn ? <p className="text-sm text-destructive" role="alert">{errors.visitedOn.message}</p> : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="rating">Rating</Label>
          <select
            id="rating"
            className="flex h-10 w-full rounded-md border border-input bg-background/80 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-invalid={Boolean(errors.rating)}
            {...register("rating")}
          >
            {[5, 4, 3, 2, 1].map((rating) => (
              <option key={rating} value={rating}>
                {rating} / 5
              </option>
            ))}
          </select>
          {errors.rating ? <p className="text-sm text-destructive" role="alert">{errors.rating.message}</p> : null}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="mood">Mood</Label>
        <select
          id="mood"
          className="flex h-10 w-full rounded-md border border-input bg-background/80 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          {...register("mood")}
        >
          {moodOptions.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="privateNotes">Private notes</Label>
        <Textarea id="privateNotes" placeholder="What made this stop memorable?" aria-invalid={Boolean(errors.privateNotes)} {...register("privateNotes")} />
        {errors.privateNotes ? <p className="text-sm text-destructive" role="alert">{errors.privateNotes.message}</p> : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="visitPhotos" className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-primary">
          <Camera className="h-4 w-4" aria-hidden="true" />
          Add visit photos
        </Label>
        <Input
          id="visitPhotos"
          name="photos"
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(event) => {
            addSelectedPhotos(event.target.files);
            event.currentTarget.value = "";
          }}
        />
        {selectedPhotos.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {selectedPhotos.map((photo) => {
              const isTooLarge = photo.file.size > maxPhotoBytes;

              return (
                <div key={photo.id} className={cn("grid gap-3 rounded-md border border-border bg-background/70 p-3 sm:grid-cols-[5rem_1fr_auto]", isTooLarge && "border-destructive/60 bg-destructive/10")}>
                  <img src={photo.previewUrl} alt={`${photo.file.name} preview`} className="aspect-square w-full rounded-md object-cover sm:w-20" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{photo.file.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{formatFileSize(photo.file.size)}</p>
                    {isTooLarge ? <p className="mt-2 text-sm text-destructive" role="alert">{photoSizeError}</p> : null}
                  </div>
                  <button
                    type="button"
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-semibold hover:bg-muted"
                    onClick={() => removeSelectedPhoto(photo.id)}
                    aria-label={`Remove ${photo.file.name}`}
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                    <span className="sm:sr-only">Remove</span>
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Optional. Add images under 4 MB each.</p>
        )}
      </div>
      {result ? <p className={result.ok ? "text-sm text-sage" : "text-sm text-destructive"} role="status">{result.message}</p> : null}
      <Button type="submit" disabled={isPending || hasInvalidPhotos}>
        {mode === "create" ? <Stamp className="h-4 w-4" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
        {isPending ? "Saving..." : mode === "create" ? "Log visit" : "Save visit"}
      </Button>
    </form>
  );
}
