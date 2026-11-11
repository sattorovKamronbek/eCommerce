"use client";
import { copy } from "@/messages";
import { Heart } from "lucide-react";
import { useShop } from "@/stores/shop";
export function WishlistButton({ id }: { id: string }) {
  const active = useShop((s) => s.wishlist.includes(id));
  const toggle = useShop((s) => s.toggleWish);
  return (
    <button
      className="wish-button icon-button"
      aria-label={
        active ? copy.sevimlilardanOlibTashlash : copy.sevimlilargaQoshish
      }
      aria-pressed={active}
      onClick={() => toggle(id)}
    >
      <Heart fill={active ? "currentColor" : "none"} />
    </button>
  );
}
