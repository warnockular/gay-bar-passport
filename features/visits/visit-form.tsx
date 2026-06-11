"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, Save, Stamp } from "lucide-react";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

export function VisitForm({ mode, venue, visit }: VisitFormProps) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<VisitActionResult | null>(null);
  const [photoLabel, setPhotoLabel] = useState("");
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

  function onSubmit(values: VisitValues) {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("visitedOn", values.visitedOn);
      formData.set("rating", String(values.rating));
      formData.set("mood", values.mood ?? "");
      formData.set("privateNotes", values.privateNotes ?? "");

      const photoInput = document.getElementById("visitPhotos") as HTMLInputElement | null;
      const photos = Array.from(photoInput?.files ?? []);

      if (photos.some((file) => file.size > maxPhotoBytes)) {
        setResult({ ok: false, message: "Keep each visit photo under 4 MB." });
        return;
      }

      photos.forEach((file) => formData.append("photos", file));

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
          <Input id="visitedOn" type="date" {...register("visitedOn")} />
          {errors.visitedOn ? <p className="text-sm text-destructive">{errors.visitedOn.message}</p> : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="rating">Rating</Label>
          <select
            id="rating"
            className="flex h-10 w-full rounded-md border border-input bg-background/80 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            {...register("rating")}
          >
            {[5, 4, 3, 2, 1].map((rating) => (
              <option key={rating} value={rating}>
                {rating} / 5
              </option>
            ))}
          </select>
          {errors.rating ? <p className="text-sm text-destructive">{errors.rating.message}</p> : null}
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
        <Textarea id="privateNotes" placeholder="What made this stop memorable?" {...register("privateNotes")} />
        {errors.privateNotes ? <p className="text-sm text-destructive">{errors.privateNotes.message}</p> : null}
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
          onChange={(event) => setPhotoLabel(event.target.files?.length ? `${event.target.files.length} photo(s) selected` : "")}
        />
        {photoLabel ? <p className="text-xs text-muted-foreground">{photoLabel}</p> : null}
      </div>
      {result ? <p className={result.ok ? "text-sm text-sage" : "text-sm text-destructive"}>{result.message}</p> : null}
      <Button type="submit" disabled={isPending}>
        {mode === "create" ? <Stamp className="h-4 w-4" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
        {isPending ? "Saving..." : mode === "create" ? "Log visit" : "Save visit"}
      </Button>
    </form>
  );
}
