"use client";
import { copy } from "@/messages";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useShop } from "@/stores/shop";
import { products } from "@/data/products";
import { formatMoney } from "@/lib/money";
import { cartTotal } from "@/lib/cart";
import { messages as uz } from "@/messages";
import { Button } from "@/components/ui/button";
export function CartContent({ compact = false }: { compact?: boolean }) {
  const items = useShop((s) => s.items);
  const update = useShop((s) => s.update);
  if (!items.length)
    return (
      <div className="empty-state">
        <ShoppingBag />
        <h2>{uz.cart.empty}</h2>
        <p>{copy.yoqtirganBuyumlaringizniShuYerdaJamlang}</p>
        <Link className="text-link" href="/katalog">
          {uz.common.explore} →
        </Link>
      </div>
    );
  return (
    <div className="cart-content">
      <div className="cart-items">
        {items.map((i) => {
          const p = products.find((p) => p.id === i.productId)!;
          const totalQuantity = items
            .filter((v) => v.productId === p.id)
            .reduce((n, v) => n + v.quantity, 0);
          return (
            <article className="cart-row" key={`${i.productId}-${i.color}`}>
              <Image src={p.image} alt={p.alt} width={100} height={120} />
              <div>
                <Link href={`/mahsulot/${p.slug}`}>{p.name}</Link>
                <p>
                  {i.color} · {formatMoney(p.price)}
                </p>
                <div className="quantity">
                  <button
                    aria-label={copy.miqdorniKamaytirish}
                    onClick={() => update(p.id, i.color, i.quantity - 1)}
                  >
                    <Minus />
                  </button>
                  <span>{i.quantity}</span>
                  <button
                    aria-label={copy.miqdorniOshirish}
                    disabled={totalQuantity >= p.stock}
                    onClick={() => update(p.id, i.color, i.quantity + 1)}
                  >
                    <Plus />
                  </button>
                </div>
              </div>
              <button
                className="icon-button"
                aria-label={`${p.name}: ${uz.cart.remove}`}
                onClick={() => update(p.id, i.color, 0)}
              >
                <Trash2 />
              </button>
            </article>
          );
        })}
      </div>
      <aside className="cart-summary">
        <div>
          <span>{uz.cart.subtotal}</span>
          <strong>{formatMoney(cartTotal(items))}</strong>
        </div>
        <p>{uz.cart.note}</p>
        <Button asChild>
          <Link href="/checkout">{uz.cart.checkout}</Link>
        </Button>
        {compact && (
          <Link className="text-link" href="/savat">
            {copy.savatniOchish}
          </Link>
        )}
      </aside>
    </div>
  );
}
