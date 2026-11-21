"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { CS2_CATEGORIES, CS2_MAX_PHOTOS, CS2_MODELS, CS2_WEAR, CS2_WEAR_NAMES, cs2PhotoHref, isCs2Category, isCs2Wear, type Cs2Category, type Cs2Wear } from "@/lib/sellers/cs2";
import type { FashionFormValues } from "@/lib/sellers/fashion";
import type { ListingActionState } from "@/lib/sellers/listing";
import type { SellerListing } from "@/lib/supabase/database";
import { cs2Dictionaries } from "@/messages/cs2-listing";
import { cs2SellerDictionaries } from "@/messages/cs2-seller";
import type { MarketplaceLocale } from "@/messages/marketplace";
import type { listingDictionaries } from "@/messages/seller-catalog";
import { acceptsCs2Photo, prepareCs2Photo } from "./cs2-photo-preparation";
import { FashionListingFields, useFashionListing } from "./fashion-listing-form";
import { ListingPhotoPicker, type ListingDraftPhoto, type ListingPhotoError } from "./listing-photo-picker";
import styles from "./cs2-listing-form.module.css";

function wearLabel(wear: Cs2Wear) {
  return wear === "NP" ? CS2_WEAR_NAMES[wear] : `${CS2_WEAR_NAMES[wear]} (${wear})`;
}

export function ListingForm({ action, copy, scope, listing, fashion, locale, submissionId }: {
  action: (state: ListingActionState, form: FormData) => Promise<ListingActionState>;
  copy: typeof listingDictionaries.en; scope: "cs2" | "fashion" | "both"; listing?: SellerListing;
  locale: MarketplaceLocale; submissionId?: string; fashion?: FashionFormValues;
}) {
  const price = listing ? `${Math.floor(listing.price_tiyin / 100)}.${String(listing.price_tiyin % 100).padStart(2, "0")}` : "";
  const [values, setValues] = useState({ ecosystem: listing?.ecosystem ?? (scope === "fashion" ? "fashion" : "cs2"), title: listing?.title ?? "", description: listing?.description ?? "", category: listing?.category ?? "", variant: listing?.variant ?? "", price, quantity: String(listing?.quantity ?? 1), state: listing?.state === "published" ? "published" : "draft" });
  const [category, setCategory] = useState<Cs2Category | "">("");
  const [model, setModel] = useState("");
  const [skinName, setSkinName] = useState("");
  const editWear = listing?.cs2_group_id ? listing.cs2_wear : null;
  const [wears, setWears] = useState<Cs2Wear[]>([]);
  const [prices, setPrices] = useState<Partial<Record<Cs2Wear, string>>>(() => editWear ? { [editWear]: price } : {});
  const [photos, setPhotos] = useState<Partial<Record<Cs2Wear, ListingDraftPhoto[]>>>(() =>
    listing && editWear ? { [editWear]: listing.cs2_images.map(id => ({ id })) } : {});
  const [preparingWear, setPreparingWear] = useState<Cs2Wear>();
  const [photoErrors, setPhotoErrors] = useState<Partial<Record<Cs2Wear, ListingPhotoError>>>({});
  const nextPhotoId = useRef(0);
  const structuredFashion = Boolean(fashion) || (!listing && values.ecosystem === "fashion");
  const fashionDraft = useFashionListing(fashion, submissionId);
  const createCs2 = !listing && !structuredFashion && values.ecosystem === "cs2";
  const structuredCs2 = createCs2 || Boolean(editWear);
  const fixedEcosystem = fashion || (structuredFashion && scope === "fashion") ? "fashion" : editWear ? "cs2" : undefined;
  const preparingPhotos = structuredFashion ? fashionDraft.preparingColor !== undefined : Boolean(preparingWear);
  const cs2Copy = cs2SellerDictionaries[locale];
  const categoryNames = cs2Dictionaries[locale].categories;
  const hintId = useId();

  async function submitListing(previous: ListingActionState, form: FormData): Promise<ListingActionState> {
    if (preparingPhotos) return { error: "invalid" };
    if (structuredFashion) {
      fashionDraft.appendFields(form);
    } else {
      const selectedWears = editWear ? [editWear] : form.getAll("cs2Wear").filter(isCs2Wear);
      for (const wear of selectedWears) {
        for (const photo of photos[wear] ?? []) {
          if (photo.file) form.append(`cs2Photo-${wear}`, photo.file);
          else form.append(`cs2Keep-${wear}`, photo.id);
        }
      }
    }
    return action(previous, form);
  }

  const [state, submit, pending] = useActionState(structuredCs2 || structuredFashion ? submitListing : action, {});
  const errorRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => { if (state.error) errorRef.current?.focus(); }, [state]);
  const change = (key: keyof typeof values) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setValues(current => ({ ...current, [key]: event.target.value }));

  function toggleWear(wear: Cs2Wear) {
    setWears(current => {
      if (current.includes(wear)) return current.filter(selected => selected !== wear);
      if (wear === "NP") return [wear];
      return [...current.filter(selected => selected !== "NP"), wear];
    });
  }

  async function addPhotos(wear: Cs2Wear, files: File[]) {
    if (preparingWear || pending) return;
    if (files.length + (photos[wear]?.length ?? 0) > CS2_MAX_PHOTOS) {
      setPhotoErrors(current => ({ ...current, [wear]: "photoLimit" }));
      return;
    }
    if (!files.every(acceptsCs2Photo)) {
      setPhotoErrors(current => ({ ...current, [wear]: "photoFormat" }));
      return;
    }

    setPreparingWear(wear);
    setPhotoErrors(current => ({ ...current, [wear]: undefined }));
    try {
      const added: ListingDraftPhoto[] = [];
      for (const file of files) {
        const prepared = await prepareCs2Photo(file);
        added.push({ id: `new-${nextPhotoId.current++}`, file: prepared });
      }
      setPhotos(current => ({ ...current, [wear]: [...(current[wear] ?? []), ...added] }));
    } catch {
      setPhotoErrors(current => ({ ...current, [wear]: "photoPrepare" }));
    } finally {
      setPreparingWear(undefined);
    }
  }

  function wearDetails(wear: Cs2Wear) {
    const priceHint = `${hintId}-${wear}`;
    return (
      <div role="group" aria-label={wearLabel(wear)} className={styles.wearDetails}>
        <label>{copy.price}
          <input
            name={`cs2Price-${wear}`}
            type="text"
            inputMode="decimal"
            value={prices[wear] ?? ""}
            onChange={event => {
              const { value } = event.target;
              setPrices(current => ({ ...current, [wear]: value }));
            }}
            aria-describedby={priceHint}
            required
          />
        </label>
        <p id={priceHint} className={styles.hint}>{copy.priceHint}</p>
        <ListingPhotoPicker
          photos={photos[wear] ?? []}
          maxPhotos={CS2_MAX_PHOTOS}
          photoHref={fileName => listing ? cs2PhotoHref(listing.id, fileName, true) : undefined}
          disabled={Boolean(preparingWear) || pending}
          preparing={preparingWear === wear}
          error={photoErrors[wear]}
          copy={cs2Copy}
          onAdd={files => void addPhotos(wear, files)}
          onRemove={id => {
            setPhotos(current => ({ ...current, [wear]: current[wear]?.filter(photo => photo.id !== id) }));
            setPhotoErrors(current => ({ ...current, [wear]: undefined }));
          }}
        />
      </div>
    );
  }

  const modelPrefix = listing?.cs2_model ? `${listing.cs2_model} | ` : "";
  const listingName = listing?.title.startsWith(modelPrefix) ? listing.title.slice(modelPrefix.length) : listing?.title;
  const fields = structuredFashion ? <FashionListingFields editor={fashionDraft} copy={copy} locale={locale} pending={pending} /> : <>
    {createCs2 ? <>
      <input type="hidden" name="cs2SubmissionId" value={submissionId ?? ""} />
      <div className={styles.modelFields}>
        <label>{copy.category}
          <select name="cs2Category" value={category} onChange={event => {
            const { value } = event.target;
            setCategory(isCs2Category(value) ? value : "");
            setModel("");
          }} required>
            <option value="" disabled>{cs2Copy.chooseCategory}</option>
            {CS2_CATEGORIES.map(value => <option key={value} value={value}>{categoryNames[value]}</option>)}
          </select>
        </label>
        <label>{cs2Copy.model}
          <select name="cs2Model" value={model} onChange={event => setModel(event.target.value)} disabled={!category} required>
            <option value="" disabled>{cs2Copy.chooseModel}</option>
            {category && CS2_MODELS[category].map(value => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
      </div>
      <label>{cs2Copy.skinName}<input name="title" value={skinName} onChange={event => setSkinName(event.target.value)} maxLength={model ? 117 - model.length : 90} required /></label>
    </> : editWear && listing ? (
      <dl className={styles.identity}>
        {listing.cs2_category && <div><dt>{copy.category}</dt><dd>{categoryNames[listing.cs2_category]}</dd></div>}
        <div><dt>{cs2Copy.model}</dt><dd>{listing.cs2_model}</dd></div>
        <div><dt>{cs2Copy.skinName}</dt><dd>{listingName}</dd></div>
        <div><dt>{cs2Copy.wear}</dt><dd>{wearLabel(editWear)}</dd></div>
      </dl>
    ) : <label>{copy.titleField}<input name="title" value={values.title} onChange={change("title")} maxLength={120} required /></label>}
    <label>{copy.description}<textarea name="description" value={values.description} onChange={change("description")} maxLength={4000} rows={5} required /></label>
    {createCs2 ? (
      <fieldset className={styles.wearGroup} aria-describedby={hintId}>
        <legend>{cs2Copy.wearVariants}</legend>
        <p id={hintId} className={styles.hint}>{cs2Copy.wearHint}</p>
        <ul className={styles.wearList}>
          {CS2_WEAR.map(wear => (
            <li key={wear} className={styles.wearRow}>
              <label className={styles.wearLabel}>
                <input name="cs2Wear" type="checkbox" value={wear} checked={wears.includes(wear)} onChange={() => toggleWear(wear)} />
                {wearLabel(wear)}
              </label>
              {wears.includes(wear) && wearDetails(wear)}
            </li>
          ))}
        </ul>
      </fieldset>
    ) : editWear ? wearDetails(editWear) : <>
      <label>{copy.category}<input name="category" value={values.category} onChange={change("category")} maxLength={80} /></label>
      <label>{copy.variant}<input name="variant" value={values.variant} onChange={change("variant")} maxLength={80} aria-describedby="listing-variant-hint" /></label><span id="listing-variant-hint" className="seller-help">{copy.variantHint}</span>
      <label>{copy.price}<input name="price" type="text" inputMode="decimal" value={values.price} onChange={change("price")} aria-describedby="listing-price-hint" required /></label><span id="listing-price-hint" className="seller-help">{copy.priceHint}</span>
    </>}
    {!createCs2 && <label>{copy.quantity}<input name="quantity" type="number" min="0" max={values.ecosystem === "cs2" ? "1" : "1000000"} step="1" value={values.quantity} onChange={change("quantity")} required /></label>}
    <label>{copy.state}<select name="state" value={values.state} onChange={change("state")}><option value="draft">{copy.draft}</option><option value="published">{copy.published}</option></select></label>
    {values.ecosystem === "cs2" && <p>{copy.scopeNotice}</p>}
  </>;

  return <form className="seller-form" action={submit} onReset={event => event.preventDefault()}>
    {state.error ? <p role="alert" tabIndex={-1} ref={errorRef}>{copy[state.error]}</p> : null}
    {fixedEcosystem ? <input type="hidden" name="ecosystem" value={fixedEcosystem} /> : (
      <label>{copy.ecosystem}<select name="ecosystem" value={values.ecosystem} onChange={change("ecosystem")} disabled={pending}>
        {scope !== "fashion" ? <option value="cs2">{copy.cs2}</option> : null}{scope !== "cs2" ? <option value="fashion">{copy.fashion}</option> : null}
      </select></label>
    )}
    {fields}
    <button type="submit" className={styles.submit} disabled={pending || preparingPhotos} aria-live="polite">
      {pending ? cs2Copy.saving : copy.save}
    </button>
  </form>;
}
