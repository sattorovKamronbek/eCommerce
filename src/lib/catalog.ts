import type { Product } from "@/data/products";
export type CatalogFilters = {
  q?: string;
  category?: string;
  available?: boolean;
  maxPrice?: number;
  sort?: string;
  fresh?: boolean;
};
export function filterProducts(products: Product[], filters: CatalogFilters) {
  const query = (filters.q ?? "").trim().toLocaleLowerCase("uz");
  const result = products.filter(
    (p) =>
      (!query ||
        `${p.name} ${p.material}`.toLocaleLowerCase("uz").includes(query)) &&
      (!filters.category || p.category === filters.category) &&
      (!filters.available || p.stock > 0) &&
      (!filters.fresh || p.isNew) &&
      (filters.maxPrice === undefined || p.price <= filters.maxPrice),
  );
  return result.sort((a, b) =>
    filters.sort === "price-asc"
      ? a.price - b.price
      : filters.sort === "price-desc"
        ? b.price - a.price
        : 0,
  );
}
