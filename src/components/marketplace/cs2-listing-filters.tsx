"use client";

import { useState } from "react";
import { CS2_CATEGORIES, CS2_MODELS, CS2_WEAR, isCs2Category, type Cs2Category } from "@/lib/sellers/cs2";
import type { Cs2ListingFilters } from "@/lib/sellers/public-query";
import { cs2CatalogDictionaries, formatCs2Wear } from "@/messages/cs2-catalog";
import { cs2Dictionaries } from "@/messages/cs2-listing";
import type { MarketplaceLocale } from "@/messages/marketplace";
import { listingDictionaries } from "@/messages/seller-catalog";

export function Cs2ListingFilterFields({ filters, locale }: { filters?: Cs2ListingFilters; locale: MarketplaceLocale }) {
  const [category, setCategory] = useState<Cs2Category | "">(filters?.category ?? "");
  const [model, setModel] = useState(filters?.model ?? "");
  const copy = cs2CatalogDictionaries[locale];
  const { categories } = cs2Dictionaries[locale];

  return <>
    <label>{listingDictionaries[locale].category}
      <select name="category" value={category} onChange={(event) => {
        const value = event.currentTarget.value;
        setCategory(isCs2Category(value) ? value : "");
        setModel("");
      }}>
        <option value="">{copy.anyCategory}</option>
        {CS2_CATEGORIES.map((key) => <option value={key} key={key}>{categories[key]}</option>)}
      </select>
    </label>
    <label>{copy.model}
      <select name="model" value={model} disabled={!category} onChange={(event) => setModel(event.currentTarget.value)}>
        <option value="">{category ? copy.anyModel : copy.chooseCategory}</option>
        {category && CS2_MODELS[category].map((name) => <option value={name} key={name}>{name}</option>)}
      </select>
    </label>
    <label>{copy.wear}
      <select name="wear" defaultValue={filters?.wear ?? ""}>
        <option value="">{copy.anyWear}</option>
        {CS2_WEAR.map((wear) => <option value={wear} key={wear}>{formatCs2Wear(locale, wear)}</option>)}
      </select>
    </label>
  </>;
}
