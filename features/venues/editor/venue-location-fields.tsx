"use client";

import { useState } from "react";
import { EditorField, fieldName, fieldValue, inputClass, type VenueEditorSectionProps, type VenueEditorValueMap } from "@/features/venues/editor/venue-editor-fields";
import { countryOptions, getCityOptions, getCountryOption, getNeighborhoodOptions } from "@/lib/location-options";

const cityNotListedValue = "__city_not_listed__";
const neighborhoodNotListedValue = "__neighborhood_not_listed__";

function countryListWithCurrent(country: string) {
  if (!country || countryOptions.some((option) => option.name === country)) return countryOptions;
  return [{ code: country, name: country }, ...countryOptions];
}

function initialValues(values: VenueEditorValueMap) {
  return {
    address: fieldValue(values, "address"),
    city: fieldValue(values, "city"),
    country: fieldValue(values, "country"),
    latitude: fieldValue(values, "latitude"),
    longitude: fieldValue(values, "longitude"),
    neighborhood: fieldValue(values, "neighborhood"),
    postal_code: fieldValue(values, "postal_code"),
    region: fieldValue(values, "region")
  };
}

export function VenueLocationFields({ fieldNames, values }: VenueEditorSectionProps) {
  const [location, setLocation] = useState(initialValues(values));
  const selectedCountry = getCountryOption(location.country);
  const configuredRegions = selectedCountry?.regions ?? [];
  const regionOptions = configuredRegions.includes(location.region) || !location.region
    ? configuredRegions
    : [location.region, ...configuredRegions];
  const cityOptions = getCityOptions(location.country, location.region);
  const useCustomCityInitial = Boolean(location.city) && cityOptions.length > 0 && !cityOptions.includes(location.city);
  const [useCustomCity, setUseCustomCity] = useState(useCustomCityInitial);
  const neighborhoodOptions = getNeighborhoodOptions(location.city);
  const useCustomNeighborhoodInitial = Boolean(location.neighborhood) && neighborhoodOptions.length > 0 && !neighborhoodOptions.includes(location.neighborhood);
  const [useCustomNeighborhood, setUseCustomNeighborhood] = useState(useCustomNeighborhoodInitial);

  function updateValue(name: keyof typeof location, value: string) {
    setLocation((current) => ({ ...current, [name]: value }));
  }

  return (
    <section className="grid gap-4 md:grid-cols-2">
      <EditorField label="Country">
        <select
          name={fieldName(fieldNames, "country")}
          value={location.country}
          onChange={(event) => {
            setUseCustomCity(false);
            setUseCustomNeighborhood(false);
            setLocation((current) => ({ ...current, city: "", country: event.target.value, neighborhood: "", region: "" }));
          }}
          className={inputClass()}
        >
          <option value="">Choose country</option>
          {countryListWithCurrent(location.country).map((option) => <option key={option.code} value={option.name}>{option.name}</option>)}
        </select>
      </EditorField>

      <EditorField label={`State / Province / Territory${configuredRegions.length ? "" : " optional"}`}>
        {configuredRegions.length ? (
          <select
            name={fieldName(fieldNames, "region")}
            value={location.region}
            onChange={(event) => {
              setUseCustomCity(false);
              setUseCustomNeighborhood(false);
              setLocation((current) => ({ ...current, city: "", neighborhood: "", region: event.target.value }));
            }}
            className={inputClass()}
          >
            <option value="">Choose one</option>
            {regionOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        ) : (
          <input name={fieldName(fieldNames, "region")} value={location.region} onChange={(event) => updateValue("region", event.target.value)} className={inputClass()} />
        )}
      </EditorField>

      <EditorField label="City">
        {cityOptions.length && !useCustomCity ? (
          <select
            name={fieldName(fieldNames, "city")}
            value={location.city}
            onChange={(event) => {
              if (event.target.value === cityNotListedValue) {
                setUseCustomCity(true);
                setUseCustomNeighborhood(false);
                setLocation((current) => ({ ...current, city: "", neighborhood: "" }));
                return;
              }
              setUseCustomNeighborhood(false);
              setLocation((current) => ({ ...current, city: event.target.value, neighborhood: "" }));
            }}
            className={inputClass()}
          >
            <option value="">Choose a city</option>
            {cityOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            <option value={cityNotListedValue}>City not listed</option>
          </select>
        ) : null}
        {useCustomCity || !cityOptions.length ? (
          <input name={fieldName(fieldNames, "city")} value={location.city} onChange={(event) => updateValue("city", event.target.value)} className={inputClass()} placeholder="Enter city or town" />
        ) : null}
      </EditorField>

      <EditorField label="Neighborhood" helpText="Optional, but helpful for neighborhood-driven browsing.">
        {neighborhoodOptions.length && !useCustomNeighborhood ? (
          <select
            name={fieldName(fieldNames, "neighborhood")}
            value={location.neighborhood}
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
          <input name={fieldName(fieldNames, "neighborhood")} value={location.neighborhood} onChange={(event) => updateValue("neighborhood", event.target.value)} className={inputClass()} placeholder={neighborhoodOptions.length ? "Enter neighborhood" : undefined} />
        ) : null}
      </EditorField>

      <EditorField label="Street Address" helpText="Use the street address when available.">
        <input name={fieldName(fieldNames, "address")} value={location.address} onChange={(event) => updateValue("address", event.target.value)} className={inputClass()} />
      </EditorField>
      <EditorField label="Postal Code">
        <input name={fieldName(fieldNames, "postal_code")} value={location.postal_code} onChange={(event) => updateValue("postal_code", event.target.value)} className={inputClass()} />
      </EditorField>
      <EditorField label="Latitude" helpText="Powers directions and future maps.">
        <input name={fieldName(fieldNames, "latitude")} value={location.latitude} onChange={(event) => updateValue("latitude", event.target.value)} inputMode="decimal" className={inputClass()} />
      </EditorField>
      <EditorField label="Longitude" helpText="Powers directions and future maps.">
        <input name={fieldName(fieldNames, "longitude")} value={location.longitude} onChange={(event) => updateValue("longitude", event.target.value)} inputMode="decimal" className={inputClass()} />
      </EditorField>
    </section>
  );
}
