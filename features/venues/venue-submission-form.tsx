"use client";

import { Send } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitCommunityVenue, type VenueSubmissionResult } from "@/features/venues/actions";
import type { Enums } from "@/types/database";

const categories: Array<{ label: string; value: Enums<"venue_category"> }> = [
  { label: "Bar", value: "bar" },
  { label: "Club", value: "club" },
  { label: "Lounge", value: "lounge" },
  { label: "Cafe", value: "cafe" },
  { label: "Performance", value: "performance" },
  { label: "Community", value: "community" }
];

function fieldError(result: VenueSubmissionResult | null, name: keyof NonNullable<VenueSubmissionResult["fieldErrors"]>) {
  return result?.fieldErrors?.[name]?.[0];
}

export function VenueSubmissionForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<VenueSubmissionResult | null>(null);

  function submit(formData: FormData) {
    startTransition(async () => {
      const actionResult = await submitCommunityVenue(formData);
      setResult(actionResult);
      if (actionResult.ok) formRef.current?.reset();
    });
  }

  return (
    <form ref={formRef} action={submit} className="grid gap-5">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Venue name</Label>
          <Input id="name" name="name" aria-invalid={Boolean(fieldError(result, "name"))} />
          {fieldError(result, "name") ? <p className="text-sm text-destructive">{fieldError(result, "name")}</p> : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Type</Label>
          <select id="category" name="category" className="h-10 w-full rounded-md border border-input bg-background/80 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            {categories.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}
          </select>
        </div>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input id="city" name="city" aria-invalid={Boolean(fieldError(result, "city"))} />
          {fieldError(result, "city") ? <p className="text-sm text-destructive">{fieldError(result, "city")}</p> : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Input id="country" name="country" aria-invalid={Boolean(fieldError(result, "country"))} />
          {fieldError(result, "country") ? <p className="text-sm text-destructive">{fieldError(result, "country")}</p> : null}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="address">Address or neighborhood</Label>
        <Input id="address" name="address" aria-invalid={Boolean(fieldError(result, "address"))} />
        {fieldError(result, "address") ? <p className="text-sm text-destructive">{fieldError(result, "address")}</p> : null}
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="websiteUrl">Website</Label>
          <Input id="websiteUrl" name="websiteUrl" type="url" placeholder="https://example.com" aria-invalid={Boolean(fieldError(result, "websiteUrl"))} />
          {fieldError(result, "websiteUrl") ? <p className="text-sm text-destructive">{fieldError(result, "websiteUrl")}</p> : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="imageUrl">Image URL optional</Label>
          <Input id="imageUrl" name="imageUrl" type="url" placeholder="https://images.unsplash.com/..." aria-invalid={Boolean(fieldError(result, "imageUrl"))} />
          {fieldError(result, "imageUrl") ? <p className="text-sm text-destructive">{fieldError(result, "imageUrl")}</p> : null}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" aria-invalid={Boolean(fieldError(result, "description"))} />
        {fieldError(result, "description") ? <p className="text-sm text-destructive">{fieldError(result, "description")}</p> : null}
      </div>
      {result ? <p className={result.ok ? "text-sm font-semibold text-sage" : "text-sm text-destructive"} role="status">{result.message}</p> : null}
      <Button type="submit" disabled={isPending}>
        <Send className="h-4 w-4" aria-hidden="true" />
        {isPending ? "Submitting..." : "Submit venue"}
      </Button>
    </form>
  );
}
