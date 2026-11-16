"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { normalizeCart, type CartItem } from "@/lib/cart";
import { products } from "@/data/products";
type ShopState = {
  items: CartItem[];
  wishlist: string[];
  add: (id: string, color: string, quantity: number) => void;
  update: (id: string, color: string, quantity: number) => void;
  toggleWish: (id: string) => void;
};
export const useShop = create<ShopState>()(
  persist(
    (set) => ({
      items: [],
      wishlist: [],
      add: (id, color, quantity) =>
        set((s) => ({
          items: normalizeCart([
            ...s.items,
            { productId: id, color, quantity },
          ]),
        })),
      update: (id, color, quantity) =>
        set((s) => ({
          items: normalizeCart(
            s.items.map((i) =>
              i.productId === id && i.color === color ? { ...i, quantity } : i,
            ),
          ),
        })),
      toggleWish: (id) =>
        set((s) => ({
          wishlist: s.wishlist.includes(id)
            ? s.wishlist.filter((v) => v !== id)
            : products.some((p) => p.id === id)
              ? [...s.wishlist, id]
              : s.wishlist,
        })),
    }),
    {
      name: "oro-shop-v1",
      version: 1,
      skipHydration: true,
      merge: (persisted, current) => {
        const saved = persisted as Partial<ShopState> | undefined;
        return {
          ...current,
          items: normalizeCart(saved?.items),
          wishlist: Array.isArray(saved?.wishlist)
            ? saved.wishlist.filter(
                (id): id is string =>
                  typeof id === "string" && products.some((p) => p.id === id),
              )
            : [],
        };
      },
    },
  ),
);
