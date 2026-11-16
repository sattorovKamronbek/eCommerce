import { copy } from "@/messages";
import { products, categories } from "@/data/products";
import { filterProducts } from "@/lib/catalog";
import { ProductCard } from "@/components/product-card";
import { messages as uz } from "@/messages";
import { Button } from "@/components/ui/button";
import Link from "next/link";
export const metadata = { title: copy.katalog };
export default async function Catalog({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const val = (key: string) =>
    typeof params[key] === "string" ? (params[key] as string) : "";
  const max = Number(val("narx"));
  const result = filterProducts(products, {
    q: val("q"),
    category: val("tur"),
    sort: val("sort"),
    available: val("mavjud") === "1",
    fresh: val("yangi") === "1",
    maxPrice: max > 0 ? max : undefined,
  });
  return (
    <div className="section page-section">
      <div className="breadcrumbs">
        <Link href="/">{copy.boshSahifa}</Link>
        <span>/</span>
        <span>{copy.katalog}</span>
      </div>
      <div className="page-heading">
        <div>
          <p className="eyebrow">{copy.didBilanTanlangan}</p>
          <h1>{val("yangi") === "1" ? uz.nav.arrivals : uz.nav.catalog}</h1>
        </div>
        <p>{copy.harKuniQadrlanadiganBuyumlar}</p>
      </div>
      <form className="catalog-filters" action="/katalog">
        <label className="search-field">
          {copy.mahsulotQidirish}
          <input
            id="qidirish"
            name="q"
            placeholder={copy.nimaniIzlayapsiz}
            defaultValue={val("q")}
          />
        </label>
        <label>
          {copy.kategoriya}
          <select name="tur" defaultValue={val("tur")}>
            <option value="">{copy.barchaKategoriyalar}</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {uz.categories[c]}
              </option>
            ))}
          </select>
        </label>
        <label>
          {copy.engYuqoriNarxSom}
          <input
            name="narx"
            type="number"
            min="0"
            placeholder={copy.cheklanmagan}
            defaultValue={val("narx")}
          />
        </label>
        <label>
          {copy.saralash}
          <select name="sort" defaultValue={val("sort")}>
            <option value="">{copy.tavsiyaEtilgan}</option>
            <option value="price-asc">{copy.avvalArzonroq}</option>
            <option value="price-desc">{copy.avvalQimmatroq}</option>
          </select>
        </label>
        <label className="check-field">
          <input
            name="mavjud"
            type="checkbox"
            value="1"
            defaultChecked={val("mavjud") === "1"}
          />
          {copy.faqatMavjud}
        </label>
        {val("yangi") === "1" && <input type="hidden" name="yangi" value="1" />}
        <Button type="submit">{copy.qollash}</Button>
        <Link className="text-link" href="/katalog">
          {copy.tozalash}
        </Link>
      </form>
      <p className="results-count" role="status">
        {result.length} {copy.taMahsulotNamunaviyKatalog}
      </p>
      {result.length ? (
        <div className="product-grid">
          {result.map((p) => (
            <ProductCard key={p.id} product={p} headingLevel={2} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>{copy.hechNarsaTopilmadi}</h2>
          <p>{copy.qidiruvSoziniYokiFiltrlarniOzgartiribKoring}</p>
          <Link className="text-link" href="/katalog">
            {copy.filtrlarniTozalash}
          </Link>
        </div>
      )}
    </div>
  );
}
