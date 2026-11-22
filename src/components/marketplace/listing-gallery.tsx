"use client";

import Image from "next/image";
import { useState } from "react";
import { cs2CatalogDictionaries } from "@/messages/cs2-catalog";
import { fashionCatalogDictionaries } from "@/messages/fashion-catalog";
import type { MarketplaceLocale } from "@/messages/marketplace";

export function ListingGallery({ ecosystem, photos, title, locale }: {
  ecosystem: "cs2" | "fashion";
  photos: string[];
  title: string;
  locale: MarketplaceLocale;
}) {
  const [selected, setSelected] = useState(0);
  const copy = ecosystem === "cs2" ? cs2CatalogDictionaries[locale] : fashionCatalogDictionaries[locale];

  return <section className="real-listing-gallery" data-ecosystem={ecosystem} aria-label={copy.photos}>
    <div className="real-listing-photo">
      <Image src={photos[selected]} fill unoptimized loading="eager"
        alt={copy.photoAlt(title, selected + 1, photos.length)} />
    </div>
    {photos.length > 1 && <div className="real-listing-thumbnails">
      {photos.map((photo, index) => <button type="button" key={photo}
        aria-label={copy.photo(index + 1)} aria-pressed={selected === index} onClick={() => setSelected(index)}>
        <Image src={photo} alt="" fill unoptimized loading="lazy" />
      </button>)}
    </div>}
  </section>;
}
