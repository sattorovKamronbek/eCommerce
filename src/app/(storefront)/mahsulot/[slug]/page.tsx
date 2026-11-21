import { copy } from "@/messages";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct, products } from "@/data/products";
import { formatMoney } from "@/lib/money";
import { ProductPurchase } from "@/components/product-purchase";
import { ProductCard } from "@/components/product-card";
import { messages as uz } from "@/messages";
export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return { title: getProduct(slug)?.name ?? copy.mahsulotTopilmadi };
}
export default async function ProductDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = getProduct(slug);
  if (!p) notFound();
  return (
    <div className="section page-section">
      <div className="breadcrumbs">
        <Link href="/">{copy.boshSahifa}</Link>
        <span>/</span>
        <Link href="/katalog">{copy.katalog}</Link>
        <span>/</span>
        <span>{p.name}</span>
      </div>
      <div className="product-detail">
        <div className="detail-image">
          <Image
            src={p.image}
            alt={p.alt}
            fill
            priority
            sizes="(max-width:760px) 100vw, 55vw"
          />
        </div>
        <div className="detail-copy">
          <p className="eyebrow">{uz.categories[p.category]}</p>
          <h1>{p.name}</h1>
          <p className="detail-price">{formatMoney(p.price)}</p>
          <p>{p.description}</p>
          <p className="stock-note">
            {p.stock > 0
              ? `${uz.product.available} · Namunaviy ${p.stock} dona`
              : uz.product.unavailable}
          </p>
          <ProductPurchase product={p} />
          <details open>
            <summary>{uz.product.details}</summary>
            <p>{p.description}</p>
            <dl>
              <dt>{uz.product.material}</dt>
              <dd>{p.material}</dd>
              <dt>{copy.artikul}</dt>
              <dd>
                {copy.artikulPrefiksi}
                {p.id.toUpperCase()}
              </dd>
            </dl>
          </details>
          <details>
            <summary>{copy.yetkazibBerishVaQaytarish}</summary>
            <p>{copy.dokonIshlabChiqilmoqdaYetkazibBerishHududlari}</p>
          </details>
        </div>
      </div>
      <section className="related">
        <div className="section-heading">
          <h2>{uz.product.related}</h2>
          <Link href="/katalog" className="text-link">
            {copy.katalog2}
          </Link>
        </div>
        <div className="product-grid">
          {products
            .filter((v) => v.id !== p.id)
            .slice(0, 4)
            .map((v) => (
              <ProductCard key={v.id} product={v} />
            ))}
        </div>
      </section>
    </div>
  );
}
