"use client";
import { copy } from "@/messages";
import Link from "next/link";
import { useShop } from "@/stores/shop";
import { products } from "@/data/products";
import { ProductCard } from "@/components/product-card";
export default function Wishlist() {
  const ids = useShop((s) => s.wishlist);
  const saved = products.filter((p) => ids.includes(p.id));
  return (
    <div className="section page-section">
      <div className="page-heading">
        <h1>{copy.sevimliBuyumlaringiz}</h1>
      </div>
      {saved.length ? (
        <div className="product-grid">
          {saved.map((p) => (
            <ProductCard key={p.id} product={p} headingLevel={2} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>{copy.haliHechNarsaSaqlanmagan}</h2>
          <p>{copy.yoqtirganMahsulotingizdagiYurakBelgisiniBosing}</p>
          <Link className="text-link" href="/katalog">
            {copy.katalogniKorish}
          </Link>
        </div>
      )}
    </div>
  );
}
