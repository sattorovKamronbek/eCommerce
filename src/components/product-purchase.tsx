"use client";
import { copy } from "@/messages";
import { useState } from "react";
import type { Product } from "@/data/products";
import { useShop } from "@/stores/shop";
import { messages as uz } from "@/messages";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Check } from "lucide-react";
export function ProductPurchase({ product: p }: { product: Product }) {
  const [color, setColor] = useState(p.colors[0]);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const add = useShop((s) => s.add);
  const used = useShop((s) =>
    s.items
      .filter((i) => i.productId === p.id)
      .reduce((n, i) => n + i.quantity, 0),
  );
  const remaining = p.stock - used;
  return (
    <div className="purchase">
      <fieldset>
        <legend>
          {uz.product.color}: {color}
        </legend>
        <div className="color-options">
          {p.colors.map((c) => (
            <label key={c}>
              <input
                type="radio"
                name="color"
                value={c}
                checked={color === c}
                onChange={() => {
                  setColor(c);
                  setAdded(false);
                }}
              />
              <span>{c}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <label className="purchase-quantity">
        {uz.product.quantity}
        <input
          type="number"
          min="1"
          max={Math.max(1, remaining)}
          value={quantity}
          onChange={(e) => {
            setQuantity(
              Math.max(
                1,
                Math.min(remaining, Math.trunc(Number(e.target.value)) || 1),
              ),
            );
            setAdded(false);
          }}
        />
      </label>
      <Button
        size="lg"
        disabled={remaining < 1}
        onClick={() => {
          add(p.id, color, Math.min(quantity, remaining));
          setAdded(true);
        }}
      >
        {added ? (
          <Check data-icon="inline-start" />
        ) : (
          <ShoppingBag data-icon="inline-start" />
        )}
        {remaining < 1
          ? p.stock === 0
            ? uz.product.unavailable
            : copy.mavjudMiqdorSavatda
          : uz.common.add}
      </Button>
      <p className="purchase-feedback" role="status">
        {added
          ? copy.savatgaQoshildiSavatBelgisidanOchishingizMumkin
          : copy.namunaviyMahsulotSotuvHaliBoshlanmagan}
      </p>
    </div>
  );
}
