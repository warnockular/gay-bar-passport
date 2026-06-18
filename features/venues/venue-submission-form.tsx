"use client";

import { Send } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitCommunityVenue, type VenueSubmissionResult } from "@/features/venues/actions";
import { VenueImagePreview } from "@/features/venues/venue-image-preview";
import { countryOptions, getCityOptions, getCountryOption, getNeighborhoodOptions } from "@/lib/location-options";
import { venueCategoryOptions } from "@/lib/venue-categories";
const initialValues = {
  address: "",
  category: "bar",
  city: "",
  country: "United States",
  description: "",
  imageUrl: "",
  name: "",
  neighborhood: "",
  region: "",
  websiteUrl: ""
};
const cityNotListedValue = "__city_not_listed__";
const neighborhoodNotListedValue = "__neighborhood_not_listed__";

function fieldError(result: VenueSubmissionResult | null, name: keyof NonNullable<VenueSubmissionResult["fieldErrors"]>) {
  return result?.fieldErrors?.[name]?.[0];
}

export function VenueSubmissionForm() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<VenueSubmissionResult | null>(null);
  const [values, setValues] = useState(initialValues);
  const [useCustomCity, setUseCustomCity] = useState(false);
  const [useCustomNeighborhood, setUseCustomNeighborhood] = useState(false);

  function updateValue(name: keyof typeof initialValues, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
  }
  const selectedCountry = getCountryOption(values.country);
  const regions = selectedCountry?.regions ?? [];
  const cityOptions = getCityOptions(values.country, values.region);
  const neighborhoodOptions = getNeighborhoodOptions(values.city);

  function submit(formData: FormData) {
    startTransition(async () => {
      const actionResult = await submitCommunityVenue(formData);
      setResult(actionResult);
      if (actionResult.ok) {
        setValues(initialValues);
        setUseCustomCity(false);
        setUseCustomNeighborhood(false);
      } else if (actionResult.values) {
        setValues((current) => ({ ...current, ...actionResult.values }));
        const submittedCountry = actionResult.values.country ?? values.country;
        const submittedRegion = actionResult.values.region ?? values.region;
        const submittedCity = actionResult.values.city ?? "";
        const submittedNeighborhood = actionResult.values.neighborhood ?? "";
        const submittedCityOptions = getCityOptions(submittedCountry, submittedRegion);
        const submittedNeighborhoodOptions = getNeighborhoodOptions(submittedCity);
        setUseCustomCity(Boolean(submittedCity) && submittedCityOptions.length > 0 && !submittedCityOptions.includes(submittedCity));
        setUseCustomNeighborhood(Boolean(submittedNeighborhood) && submittedNeighborhoodOptions.length > 0 && !submittedNeighborhoodOptions.includes(submittedNeighborhood));
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
            {venueCategoryOptions.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}
          </select>
        </div>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <select
            id="country"
            name="country"
            value={values.country}
            onChange={(event) => {
              setUseCustomCity(false);
              setUseCustomNeighborhood(false);
              setValues((current) => ({ ...current, city: "", country: event.target.value, neighborhood: "", region: "" }));
            }}
            className="h-10 w-full rounded-md border border-input bg-background/80 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-invalid={Boolean(fieldError(result, "country"))}
          >
            {countryOptions.map((country) => <option key={country.code} value={country.name}>{country.name}</option>)}
          </select>
          {fieldError(result, "country") ? <p className="text-sm text-destructive">{fieldError(result, "country")}</p> : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="region">State / Province / Territory{regions.length ? "" : " optional"}</Label>
          {regions.length ? (
            <select
              id="region"
              name="region"
              value={values.region}
              onChange={(event) => {
                setUseCustomCity(false);
                setUseCustomNeighborhood(false);
                setValues((current) => ({ ...current, city: "", neighborhood: "", region: event.target.value }));
              }}
              className="h-10 w-full rounded-md border border-input bg-background/80 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-invalid={Boolean(fieldError(result, "region"))}
            >
              <option value="">Choose one</option>
              {regions.map((region) => <option key={region} value={region}>{region}</option>)}
            </select>
          ) : (
            <Input id="region" name="region" value={values.region} onChange={(event) => updateValue("region", event.target.value)} aria-invalid={Boolean(fieldError(result, "region"))} />
          )}
          {fieldError(result, "region") ? <p className="text-sm text-destructive">{fieldError(result, "region")}</p> : null}
        </div>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          {cityOptions.length && !useCustomCity ? (
            <select
              id="city"
              name="city"
              value={values.city}
              onChange={(event) => {
                if (event.target.value === cityNotListedValue) {
                  setUseCustomCity(true);
                  setUseCustomNeighborhood(false);
                  setValues((current) => ({ ...current, city: "", neighborhood: "" }));
                  return;
                }
                setUseCustomNeighborhood(false);
                setValues((current) => ({ ...current, city: event.target.value, neighborhood: "" }));
              }}
              className="h-10 w-full rounded-md border border-input bg-background/80 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-invalid={Boolean(fieldError(result, "city"))}
            >
              <option value="">Choose a city</option>
              {cityOptions.map((city) => <option key={city} value={city}>{city}</option>)}
              <option value={cityNotListedValue}>City not listed</option>
            </select>
          ) : null}
          {useCustomCity || !cityOptions.length ? (
            <Input id="city" name="city" placeholder="Enter city or town" value={values.city} onChange={(event) => updateValue("city", event.target.value)} aria-invalid={Boolean(fieldError(result, "city"))} />
          ) : null}
          <p className="text-xs text-muted-foreground">Use the city that matches the selected country and region.</p>
          {fieldError(result, "city") ? <p className="text-sm text-destructive">{fieldError(result, "city")}</p> : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="neighborhood">Neighborhood (optional)</Label>
          {neighborhoodOptions.length && !useCustomNeighborhood ? (
            <select
              id="neighborhood"
              name="neighborhood"
              value={values.neighborhood}
              onChange={(event) => {
                if (event.target.value === neighborhoodNotListedValue) {
                  setUseCustomNeighborhood(true);
                  updateValue("neighborhood", "");
                  return;
                }
                updateValue("neighborhood", event.target.value);
              }}
              className="h-10 w-full rounded-md border border-input bg-background/80 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-invalid={Boolean(fieldError(result, "neighborhood"))}
            >
              <option value="">Choose a neighborhood</option>
              {neighborhoodOptions.map((neighborhood) => <option key={neighborhood} value={neighborhood}>{neighborhood}</option>)}
              <option value={neighborhoodNotListedValue}>Neighborhood not listed</option>
            </select>
          ) : null}
          {useCustomNeighborhood || !neighborhoodOptions.length ? (
            <Input id="neighborhood" name="neighborhood" placeholder={neighborhoodOptions.length ? "Enter neighborhood" : undefined} value={values.neighborhood} onChange={(event) => updateValue("neighborhood", event.target.value)} aria-invalid={Boolean(fieldError(result, "neighborhood"))} />
          ) : null}
          <p className="text-xs text-muted-foreground">Optional, but required if no street address is provided. Helpful for NYC, Montreal, and other neighborhood-driven browsing.</p>
          {fieldError(result, "neighborhood") ? <p className="text-sm text-destructive">{fieldError(result, "neighborhood")}</p> : null}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="address">Address (optional if neighborhood is provided)</Label>
        <Input id="address" name="address" value={values.address} onChange={(event) => updateValue("address", event.target.value)} aria-invalid={Boolean(fieldError(result, "address"))} />
        <p className="text-xs text-muted-foreground">Use the street address when available.</p>
        {fieldError(result, "address") ? <p className="text-sm text-destructive">{fieldError(result, "address")}</p> : null}
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
          <VenueImagePreview
            alt="Venue image preview"
            className="h-48 w-full sm:h-56"
            imageUrl={values.imageUrl}
            mode="submission"
          />
          {fieldError(result, "imageUrl") ? <p className="text-sm text-destructive">{fieldError(result, "imageUrl")}</p> : null}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description for moderators</Label>
        <Textarea id="description" name="description" value={values.description} onChange={(event) => updateValue("description", event.target.value)} aria-invalid={Boolean(fieldError(result, "description"))} />
        <p className="text-xs text-muted-foreground">Briefly explain what kind of LGBTQ+ venue this is and why it belongs in the directory.</p>
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
