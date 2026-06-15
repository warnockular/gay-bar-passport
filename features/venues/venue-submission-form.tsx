"use client";

import { Send } from "lucide-react";
import { useState, useTransition } from "react";
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
const initialValues = {
  address: "",
  category: "bar",
  city: "",
  country: "",
  description: "",
  imageUrl: "",
  name: "",
  neighborhood: "",
  websiteUrl: ""
};

function fieldError(result: VenueSubmissionResult | null, name: keyof NonNullable<VenueSubmissionResult["fieldErrors"]>) {
  return result?.fieldErrors?.[name]?.[0];
}

export function VenueSubmissionForm() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<VenueSubmissionResult | null>(null);
  const [values, setValues] = useState(initialValues);

  function updateValue(name: keyof typeof initialValues, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  function submit(formData: FormData) {
    startTransition(async () => {
      const actionResult = await submitCommunityVenue(formData);
      setResult(actionResult);
      if (actionResult.ok) {
        setValues(initialValues);
      } else if (actionResult.values) {
        setValues((current) => ({ ...current, ...actionResult.values }));
      }
    });
  }

  return (
    <form action={submit} className="grid gap-5">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Venue name</Label>
          <Input id="name" name="name" value={values.name} onChange={(event) => updateValue("name", event.target.value)} aria-invalid={Boolean(fieldError(result, "name"))} />
          {fieldError(result, "name") ? <p className="text-sm text-destructive">{fieldError(result, "name")}</p> : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Type</Label>
          <select id="category" name="category" value={values.category} onChange={(event) => updateValue("category", event.target.value)} className="h-10 w-full rounded-md border border-input bg-background/80 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            {categories.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}
          </select>
        </div>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input id="city" name="city" value={values.city} onChange={(event) => updateValue("city", event.target.value)} aria-invalid={Boolean(fieldError(result, "city"))} />
          {fieldError(result, "city") ? <p className="text-sm text-destructive">{fieldError(result, "city")}</p> : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Input id="country" name="country" value={values.country} onChange={(event) => updateValue("country", event.target.value)} aria-invalid={Boolean(fieldError(result, "country"))} />
          {fieldError(result, "country") ? <p className="text-sm text-destructive">{fieldError(result, "country")}</p> : null}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input id="address" name="address" value={values.address} onChange={(event) => updateValue("address", event.target.value)} aria-invalid={Boolean(fieldError(result, "address"))} />
        {fieldError(result, "address") ? <p className="text-sm text-destructive">{fieldError(result, "address")}</p> : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="neighborhood">Neighborhood optional</Label>
        <Input id="neighborhood" name="neighborhood" value={values.neighborhood} onChange={(event) => updateValue("neighborhood", event.target.value)} aria-invalid={Boolean(fieldError(result, "neighborhood"))} />
        {fieldError(result, "neighborhood") ? <p className="text-sm text-destructive">{fieldError(result, "neighborhood")}</p> : null}
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="websiteUrl">Website</Label>
          <Input id="websiteUrl" name="websiteUrl" type="url" value={values.websiteUrl} onChange={(event) => updateValue("websiteUrl", event.target.value)} placeholder="https://example.com" aria-invalid={Boolean(fieldError(result, "websiteUrl"))} />
          {fieldError(result, "websiteUrl") ? <p className="text-sm text-destructive">{fieldError(result, "websiteUrl")}</p> : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="imageUrl">Image URL optional</Label>
          <Input id="imageUrl" name="imageUrl" type="url" value={values.imageUrl} onChange={(event) => updateValue("imageUrl", event.target.value)} placeholder="https://images.unsplash.com/..." aria-invalid={Boolean(fieldError(result, "imageUrl"))} />
          {fieldError(result, "imageUrl") ? <p className="text-sm text-destructive">{fieldError(result, "imageUrl")}</p> : null}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" value={values.description} onChange={(event) => updateValue("description", event.target.value)} aria-invalid={Boolean(fieldError(result, "description"))} />
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
