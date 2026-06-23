"use client";

import { useState } from "react";
import { countryOptions, getCityOptions, getCountryOption, getNeighborhoodOptions } from "@/lib/location-options";

type AdminVenueLocationFieldsProps = {
  address: string;
  city: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  neighborhood: string;
  region: string;
};

const cityNotListedValue = "__city_not_listed__";
const neighborhoodNotListedValue = "__neighborhood_not_listed__";

function inputClass() {
  return "h-10 w-full rounded-md border border-input bg-background/80 px-3 text-sm";
}

function Field({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <label className="space-y-2 text-sm font-semibold">
      <span>{label}</span>
      {children}
    </label>
  );
}

function countryListWithCurrent(country: string) {
  if (!country || countryOptions.some((option) => option.name === country)) return countryOptions;
  return [{ code: country, name: country }, ...countryOptions];
}

export function AdminVenueLocationFields({
  address,
  city,
  country,
  latitude,
  longitude,
  neighborhood,
  region
}: AdminVenueLocationFieldsProps) {
  const [values, setValues] = useState({
    address,
    city,
    country,
    latitude: latitude !== null ? String(latitude) : "",
    longitude: longitude !== null ? String(longitude) : "",
    neighborhood,
    region
  });
  const selectedCountry = getCountryOption(values.country);
  const configuredRegions = selectedCountry?.regions ?? [];
  const regionOptions = configuredRegions.includes(values.region) || !values.region
    ? configuredRegions
    : [values.region, ...configuredRegions];
  const configuredCityOptions = getCityOptions(values.country, values.region);
  const useCustomCityInitial = Boolean(values.city) && configuredCityOptions.length > 0 && !configuredCityOptions.includes(values.city);
  const [useCustomCity, setUseCustomCity] = useState(useCustomCityInitial);
  const neighborhoodOptions = getNeighborhoodOptions(values.city);
  const useCustomNeighborhoodInitial = Boolean(values.neighborhood) && neighborhoodOptions.length > 0 && !neighborhoodOptions.includes(values.neighborhood);
  const [useCustomNeighborhood, setUseCustomNeighborhood] = useState(useCustomNeighborhoodInitial);

  function updateValue(name: keyof typeof values, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  return (
    <div className="mt-4 grid gap-4 md:grid-cols-2">
      <Field label="Country">
        <select
          name="country"
          value={values.country}
          onChange={(event) => {
            setUseCustomCity(false);
            setUseCustomNeighborhood(false);
            setValues((current) => ({ ...current, city: "", country: event.target.value, neighborhood: "", region: "" }));
          }}
          className={inputClass()}
        >
          {countryListWithCurrent(values.country).map((option) => <option key={option.code} value={option.name}>{option.name}</option>)}
        </select>
      </Field>

      <Field label={`State / Province / Territory${configuredRegions.length ? "" : " optional"}`}>
        {configuredRegions.length ? (
          <select
            name="region"
            value={values.region}
            onChange={(event) => {
              setUseCustomCity(false);
              setUseCustomNeighborhood(false);
              setValues((current) => ({ ...current, city: "", neighborhood: "", region: event.target.value }));
            }}
            className={inputClass()}
          >
            <option value="">Choose one</option>
            {regionOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        ) : (
          <input name="region" value={values.region} onChange={(event) => updateValue("region", event.target.value)} className={inputClass()} />
        )}
      </Field>

      <Field label="City">
        {configuredCityOptions.length && !useCustomCity ? (
          <select
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
            className={inputClass()}
          >
            <option value="">Choose a city</option>
            {configuredCityOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            <option value={cityNotListedValue}>City not listed</option>
          </select>
        ) : null}
        {useCustomCity || !configuredCityOptions.length ? (
          <input name="city" value={values.city} onChange={(event) => updateValue("city", event.target.value)} className={inputClass()} placeholder="Enter city or town" />
        ) : null}
      </Field>

      <Field label="Neighborhood">
        {neighborhoodOptions.length && !useCustomNeighborhood ? (
          <select
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
            className={inputClass()}
          >
            <option value="">Choose a neighborhood</option>
            {neighborhoodOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            <option value={neighborhoodNotListedValue}>Neighborhood not listed</option>
          </select>
        ) : null}
        {useCustomNeighborhood || !neighborhoodOptions.length ? (
          <input name="neighborhood" value={values.neighborhood} onChange={(event) => updateValue("neighborhood", event.target.value)} className={inputClass()} placeholder={neighborhoodOptions.length ? "Enter neighborhood" : undefined} />
        ) : null}
      </Field>

      <Field label="Address">
        <input name="address" value={values.address} onChange={(event) => updateValue("address", event.target.value)} className={inputClass()} />
      </Field>
      <Field label="Latitude">
        <input name="latitude" value={values.latitude} onChange={(event) => updateValue("latitude", event.target.value)} inputMode="decimal" className={inputClass()} />
      </Field>
      <Field label="Longitude">
        <input name="longitude" value={values.longitude} onChange={(event) => updateValue("longitude", event.target.value)} inputMode="decimal" className={inputClass()} />
      </Field>
    </div>
  );
}
