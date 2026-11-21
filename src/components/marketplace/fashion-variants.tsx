import Link from "next/link";
import type { PublicListing } from "@/lib/supabase/database";
import { fashionCatalogDictionaries } from "@/messages/fashion-catalog";
import type { MarketplaceLocale } from "@/messages/marketplace";

type Variant = Pick<PublicListing, "id" | "fashion_color_id" | "fashion_color" | "fashion_size" | "available">;

const letterSizes = ["XXXS", "XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL"];

export function FashionVariants({ variants, selected, locale, detailQuery }: {
  variants: Variant[];
  selected: Variant;
  locale: MarketplaceLocale;
  detailQuery: string;
}) {
  const copy = fashionCatalogDictionaries[locale];
  const colors = new Map<string, { name: string; sizes: { id: string; size: string; available: boolean }[] }>();
  for (const { id, fashion_color_id: colorId, fashion_color: name, fashion_size: size, available } of [selected, ...variants]) {
    if (!colorId || !name || !size) continue;
    const color = colors.get(colorId) ?? { name, sizes: [] };
    color.sizes.push({ id, size, available });
    colors.set(colorId, color);
  }
  const selectedColor = colors.get(selected.fashion_color_id ?? "");
  if (!selectedColor) return null;

  const collator = new Intl.Collator(locale, { numeric: true, sensitivity: "base" });
  for (const { sizes } of colors.values()) {
    sizes.sort((a, b) => {
      const aRank = letterSizes.indexOf(a.size.toUpperCase());
      const bRank = letterSizes.indexOf(b.size.toUpperCase());
      if (aRank < 0 && bRank < 0) return collator.compare(a.size, b.size);
      return (aRank < 0 ? letterSizes.length : aRank) - (bRank < 0 ? letterSizes.length : bRank);
    });
  }
  const href = (id: string) => `/${locale}/listings/fashion/${id}${detailQuery}`;

  return <div className="fashion-variant-options">
    <nav aria-labelledby="fashion-colors">
      <h3 id="fashion-colors">{copy.color}</h3>
      <ul>
        {[...colors].sort(([, a], [, b]) => collator.compare(a.name, b.name)).map(([colorId, color]) => {
          const current = colorId === selected.fashion_color_id;
          const matching = color.sizes.find(({ size }) => size === selected.fashion_size);
          const target = (matching?.available ? matching : color.sizes.find(({ available }) => available)) ?? matching ?? color.sizes[0];
          return <li key={colorId}>
            <Link href={href(current ? selected.id : target.id)} prefetch={false} aria-current={current ? "page" : undefined}>
              {color.name}
            </Link>
          </li>;
        })}
      </ul>
    </nav>
    <nav aria-labelledby="fashion-sizes">
      <h3 id="fashion-sizes">{copy.size}</h3>
      <ul>
        {selectedColor.sizes.map(({ id, size, available }) => <li key={id}>
          <Link href={href(id)} prefetch={false} aria-current={id === selected.id ? "page" : undefined}>
            {size}
            {!available && <small>{copy.soldOut}</small>}
          </Link>
        </li>)}
      </ul>
    </nav>
  </div>;
}

export function FashionSizeGuide({ guide, locale }: {
  guide: NonNullable<PublicListing["fashion_size_guide"]>;
  locale: MarketplaceLocale;
}) {
  const copy = fashionCatalogDictionaries[locale];
  return <details className="fashion-size-guide">
    <summary>{copy.sizeGuide}</summary>
    <table aria-label={copy.sizeGuide}>
      <thead><tr><th scope="col">{copy.size}</th><th scope="col">{copy.measurements}</th></tr></thead>
      <tbody>{guide.map(({ size, measurements }) => <tr key={size}>
        <th scope="row">{size}</th><td>{measurements}</td>
      </tr>)}</tbody>
    </table>
  </details>;
}
