"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ImageUp, Save } from "lucide-react";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createJournalEntry, updateJournalEntry, type JournalActionResult } from "@/features/journal/actions";
import { journalSchema, type JournalValues } from "@/schemas/journal";
import type { JournalEntryWithRelations, JournalFormOptions } from "@/services/journal";

type JournalFormProps = {
  entry?: JournalEntryWithRelations;
  mode: "create" | "edit";
  options: JournalFormOptions;
};

const maxPhotoBytes = 4 * 1024 * 1024;

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function JournalForm({ entry, mode, options }: JournalFormProps) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<JournalActionResult | null>(null);
  const [photoLabel, setPhotoLabel] = useState("");
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<JournalValues>({
    resolver: zodResolver(journalSchema),
    defaultValues: {
      body: entry?.body ?? "",
      city: entry?.city ?? entry?.venue?.city ?? "",
      citySlug: entry?.city_slug ?? entry?.venue?.city_slug ?? "",
      country: entry?.country ?? entry?.venue?.country ?? "",
      countrySlug: entry?.country_slug ?? entry?.venue?.country_slug ?? "",
      entryDate: entry?.entry_date ?? new Date().toISOString().slice(0, 10),
      favoriteId: entry?.favorite_id ?? "",
      isPrivate: entry?.is_private ?? true,
      title: entry?.title ?? "",
      venueId: entry?.venue_id ?? "",
      visitId: entry?.visit_id ?? ""
    }
  });

  function applyVenue(value: string) {
    const venue = options.venues.find((item) => item.id === value);
    if (!venue) return;
    setValue("city", venue.city);
    setValue("citySlug", venue.city_slug);
    setValue("country", venue.country);
    setValue("countrySlug", venue.country_slug);
  }

  function applyVisit(value: string) {
    const visit = options.visits.find((item) => item.id === value);
    if (!visit?.venues) return;
    setValue("venueId", visit.venue_id);
    setValue("city", visit.venues.city);
    setValue("citySlug", visit.venues.city_slug);
    setValue("country", visit.venues.country);
    setValue("countrySlug", visit.venues.country_slug);
  }

  function onSubmit(values: JournalValues) {
    startTransition(async () => {
      const photos = Array.from((document.getElementById("journalPhotos") as HTMLInputElement | null)?.files ?? []);

      if (photos.some((file) => file.size > maxPhotoBytes)) {
        setResult({ ok: false, message: "Keep each journal photo under 4 MB." });
        return;
      }

      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => formData.set(key, String(value ?? "")));
      photos.forEach((file) => formData.append("photos", file));

      const actionResult = mode === "create" ? await createJournalEntry(formData) : entry ? await updateJournalEntry(entry.id, formData) : { ok: false, message: "Entry details are missing." };
      setResult(actionResult);
    });
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" placeholder="A golden hour at Velvet Atlas" aria-invalid={Boolean(errors.title)} {...register("title")} />
          {errors.title ? <p className="text-sm text-destructive" role="alert">{errors.title.message}</p> : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="entryDate">Date</Label>
          <Input id="entryDate" type="date" aria-invalid={Boolean(errors.entryDate)} {...register("entryDate")} />
          {errors.entryDate ? <p className="text-sm text-destructive" role="alert">{errors.entryDate.message}</p> : null}
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Input id="country" placeholder="Portugal" aria-invalid={Boolean(errors.country)} {...register("country", { onChange: (event) => setValue("countrySlug", slugify(event.target.value)) })} />
          <input type="hidden" {...register("countrySlug")} />
          {errors.country ? <p className="text-sm text-destructive" role="alert">{errors.country.message}</p> : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input id="city" placeholder="Lisbon" aria-invalid={Boolean(errors.city)} {...register("city", { onChange: (event) => setValue("citySlug", slugify(event.target.value)) })} />
          <input type="hidden" {...register("citySlug")} />
          {errors.city ? <p className="text-sm text-destructive" role="alert">{errors.city.message}</p> : null}
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="venueId">Venue</Label>
          <select id="venueId" className="flex h-10 w-full rounded-md border border-input bg-background/80 px-3 py-2 text-sm" {...register("venueId", { onChange: (event) => applyVenue(event.target.value) })}>
            <option value="">No venue</option>
            {options.venues.map((venue) => (
              <option key={venue.id} value={venue.id}>
                {venue.name} · {venue.city}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="visitId">Logged visit</Label>
          <select id="visitId" className="flex h-10 w-full rounded-md border border-input bg-background/80 px-3 py-2 text-sm" {...register("visitId", { onChange: (event) => applyVisit(event.target.value) })}>
            <option value="">No visit</option>
            {options.visits.map((visit) => (
              <option key={visit.id} value={visit.id}>
                {visit.visited_on} · {visit.venues?.name ?? "Venue"}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="favoriteId">Favorite</Label>
          <select id="favoriteId" className="flex h-10 w-full rounded-md border border-input bg-background/80 px-3 py-2 text-sm" {...register("favoriteId")}>
            <option value="">No favorite</option>
            {options.favorites.map((favorite) => (
              <option key={favorite.id} value={favorite.id}>
                {favorite.venues?.name ?? "Favorite venue"}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="body">Entry</Label>
        <Textarea id="body" className="min-h-64 font-mono leading-7" placeholder="Write with simple Markdown-style headings, bullets, and paragraphs." aria-invalid={Boolean(errors.body)} {...register("body")} />
        {errors.body ? <p className="text-sm text-destructive" role="alert">{errors.body.message}</p> : null}
      </div>

      <label className="flex items-start gap-3 rounded-md border border-border bg-background/70 p-4 text-sm leading-6">
        <input id="isPrivate" type="checkbox" className="mt-1" {...register("isPrivate")} />
        <span>
          <span className="block font-semibold">Keep this entry private</span>
          <span className="text-muted-foreground">Turn this off when you want the entry to appear on your public profile and follower feed.</span>
        </span>
      </label>

      <div className="space-y-2">
        <Label htmlFor="journalPhotos" className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-primary">
          <ImageUp className="h-4 w-4" aria-hidden="true" />
          Add journal photos
        </Label>
        <Input id="journalPhotos" name="photos" type="file" accept="image/*" multiple className="sr-only" onChange={(event) => setPhotoLabel(event.target.files?.length ? `${event.target.files.length} photo(s) selected` : "")} />
        {photoLabel ? <p className="text-xs text-muted-foreground">{photoLabel}</p> : null}
      </div>

      {result ? <p className={result.ok ? "text-sm text-sage" : "text-sm text-destructive"} role="status">{result.message}</p> : null}
      <Button type="submit" disabled={isPending}>
        <Save className="h-4 w-4" aria-hidden="true" />
        {isPending ? "Saving..." : mode === "create" ? "Save entry" : "Update entry"}
      </Button>
    </form>
  );
}
