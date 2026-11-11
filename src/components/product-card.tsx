import { copy } from "@/messages";
import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/data/products";
import { formatMoney } from "@/lib/money";
import { WishlistButton } from "./wishlist-button";
export function ProductCard({
  product,
  headingLevel = 3,
}: {
  product: Product;
  headingLevel?: 2 | 3;
}) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return (
    <article className="product-card">
      <div className="product-image">
        <Link href={`/mahsulot/${product.slug}`}>
          <Image
            src={product.image}
            alt={product.alt}
            fill
            sizes="(max-width: 600px) 45vw, (max-width: 1000px) 45vw, 23vw"
          />
        </Link>
        {product.isNew && <span className="product-label">{copy.yangi}</span>}
        <WishlistButton id={product.id} />
      </div>
      <div className="product-meta">
        <Link href={`/mahsulot/${product.slug}`}>
          <Heading className="product-name">{product.name}</Heading>
        </Link>
        <span>{formatMoney(product.price)}</span>
      </div>
      <p className="product-material">
        {product.material}
        {product.stock === 0 ? copy.mavjudEmas : ""}
      </p>
    </article>
  );
}
