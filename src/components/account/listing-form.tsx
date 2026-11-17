"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { ListingActionState } from "@/lib/sellers/listing";
import type { SellerListing } from "@/lib/supabase/database";
import type { listingDictionaries } from "@/messages/seller-catalog";

export function ListingForm({ action, copy, scope, listing }: {
  action: (state: ListingActionState, form: FormData) => Promise<ListingActionState>;
  copy: typeof listingDictionaries.en; scope: "cs2" | "fashion" | "both"; listing?: SellerListing;
}) {
  const [state, submit, pending] = useActionState(action, {});
  const price = listing ? `${Math.floor(listing.price_tiyin / 100)}.${String(listing.price_tiyin % 100).padStart(2, "0")}` : "";
  const [values, setValues] = useState({ ecosystem: listing?.ecosystem ?? (scope === "fashion" ? "fashion" : "cs2"), title: listing?.title ?? "", description: listing?.description ?? "", category: listing?.category ?? "", variant: listing?.variant ?? "", price, quantity: String(listing?.quantity ?? 1), state: listing?.state === "published" ? "published" : "draft" });
  const errorRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => { if (state.error) errorRef.current?.focus(); }, [state]);
  const change = (key: keyof typeof values) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setValues(current => ({ ...current, [key]: event.target.value }));
  return <form className="seller-form" action={submit} onReset={event => event.preventDefault()}>
    {state.error ? <p role="alert" tabIndex={-1} ref={errorRef}>{copy[state.error]}</p> : null}
    <label>{copy.ecosystem}<select name="ecosystem" value={values.ecosystem} onChange={change("ecosystem")}>
      {scope !== "fashion" ? <option value="cs2">{copy.cs2}</option> : null}{scope !== "cs2" ? <option value="fashion">{copy.fashion}</option> : null}
    </select></label>
    <label>{copy.titleField}<input name="title" value={values.title} onChange={change("title")} maxLength={120} required /></label>
    <label>{copy.description}<textarea name="description" value={values.description} onChange={change("description")} maxLength={4000} rows={5} required /></label>
    <label>{copy.category}<input name="category" value={values.category} onChange={change("category")} maxLength={80} /></label>
    <label>{copy.variant}<input name="variant" value={values.variant} onChange={change("variant")} maxLength={80} aria-describedby="listing-variant-hint" /></label><span id="listing-variant-hint" className="seller-help">{copy.variantHint}</span>
    <label>{copy.price}<input name="price" type="text" inputMode="decimal" value={values.price} onChange={change("price")} aria-describedby="listing-price-hint" required /></label><span id="listing-price-hint" className="seller-help">{copy.priceHint}</span>
    <label>{copy.quantity}<input name="quantity" type="number" min="0" max={values.ecosystem === "cs2" ? "1" : "1000000"} step="1" value={values.quantity} onChange={change("quantity")} required /></label>
    <label>{copy.state}<select name="state" value={values.state} onChange={change("state")}><option value="draft">{copy.draft}</option><option value="published">{copy.published}</option></select></label>
    <p>{copy.scopeNotice}</p><button disabled={pending}>{copy.save}</button>
  </form>;
}
