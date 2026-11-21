"use client";

import Image from "next/image";
import { useState } from "react";
import { cs2PhotoHref } from "@/lib/sellers/cs2";
import { cs2CatalogDictionaries } from "@/messages/cs2-catalog";
import type { MarketplaceLocale } from "@/messages/marketplace";

export function Cs2ListingGallery({ id, files, title, locale }: {
  id: string;
  files: string[];
  title: string;
  locale: MarketplaceLocale;
}) {
  const [selected, setSelected] = useState(0);
  const copy = cs2CatalogDictionaries[locale];

  return <section className="real-listing-gallery" aria-label={copy.photos}>
    <div className="real-listing-photo">
      <Image src={cs2PhotoHref(id, files[selected])} fill unoptimized loading="eager"
        alt={copy.photoAlt(title, selected + 1, files.length)} />
    </div>
    {files.length > 1 && <div className="real-listing-thumbnails">
      {files.map((file, index) => <button type="button" key={file}
        aria-label={copy.photo(index + 1)} aria-pressed={selected === index} onClick={() => setSelected(index)}>
        <Image src={cs2PhotoHref(id, file)} alt="" fill unoptimized loading="lazy" />
      </button>)}
    </div>}
  </section>;
}
