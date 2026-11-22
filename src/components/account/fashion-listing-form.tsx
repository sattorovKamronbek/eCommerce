import { useEffect, useId, useRef, useState, type ChangeEvent } from "react";
import { CS2_MAX_PHOTOS } from "@/lib/sellers/cs2";
import {
  FASHION_MAX_BRAND_LENGTH, FASHION_MAX_COLORS, FASHION_MAX_COLOR_LENGTH, FASHION_MAX_DETAIL_LENGTH,
  FASHION_MAX_GUIDE_ROWS, FASHION_MAX_MEASUREMENTS, FASHION_MAX_SIZES, FASHION_MAX_SIZE_LENGTH,
  fashionPhotoHref, type FashionFormValues,
} from "@/lib/sellers/fashion";
import { cs2SellerDictionaries } from "@/messages/cs2-seller";
import { fashionSellerDictionaries } from "@/messages/fashion-seller";
import type { MarketplaceLocale } from "@/messages/marketplace";
import type { listingDictionaries } from "@/messages/seller-catalog";
import { acceptsCs2Photo, prepareCs2Photo } from "./cs2-photo-preparation";
import { ListingPhotoPicker, type ListingDraftPhoto, type ListingPhotoError } from "./listing-photo-picker";
import styles from "./fashion-listing-form.module.css";

type FormCopy = typeof listingDictionaries.en;
type ProductFields = Omit<FashionFormValues, "colors" | "sizeGuide" | "productId">;
type Size = FashionFormValues["colors"][number]["sizes"][number] & { key: string };
type GuideRow = FashionFormValues["sizeGuide"][number] & { key: string };
type Color = { id: string; name: string; sizes: Size[]; photos: ListingDraftPhoto[]; photoError?: ListingPhotoError };

function newSize(key: string): Size {
  return { key, size: "", quantity: "1", price: "" };
}

function newColor(id: string): Color {
  return { id, name: "", sizes: [newSize("0")], photos: [] };
}

export function useFashionListing(initial?: FashionFormValues, submissionId = "") {
  const productId = initial?.productId ?? submissionId;
  const [values, setValues] = useState<ProductFields>(() => initial ? {
    title: initial.title, description: initial.description, category: initial.category, brand: initial.brand,
    material: initial.material, fit: initial.fit, care: initial.care, price: initial.price, state: initial.state,
  } : { title: "", description: "", category: "", brand: "", material: "", fit: "", care: "", price: "", state: "draft" });
  const [colors, setColors] = useState<Color[]>(() => initial?.colors.length ? initial.colors.map(color => ({
    id: color.id, name: color.name, photos: color.images.map(id => ({ id })),
    sizes: color.sizes.map((size, index) => ({ ...size, key: String(index) })),
  })) : [newColor(productId)]);
  const [sizeGuide, setSizeGuide] = useState<GuideRow[]>(() => initial?.sizeGuide.map((row, index) => ({ ...row, key: String(index) })) ?? []);
  const [preparingColor, setPreparingColor] = useState<string>();

  function updateColor(id: string, update: (color: Color) => Color) {
    setColors(current => current.map(color => color.id === id ? update(color) : color));
  }

  function appendFields(form: FormData) {
    form.set("fashionPayload", JSON.stringify({
      colors: colors.map(({ id, name, sizes }) => ({
        id, name, sizes: sizes.map(({ size, quantity, price }) => ({ size, quantity, price })),
      })),
      sizeGuide: sizeGuide.map(({ size, measurements }) => ({ size, measurements })),
    }));
    for (const { id, photos } of colors) {
      for (const photo of photos) {
        if (photo.file) form.append(`fashionPhoto-${id}`, photo.file);
        else form.append(`fashionKeep-${id}`, photo.id);
      }
    }
  }

  async function addPhotos(color: Color, files: File[]) {
    if (preparingColor !== undefined) return;
    if (files.length + color.photos.length > CS2_MAX_PHOTOS) {
      updateColor(color.id, current => ({ ...current, photoError: "photoLimit" }));
      return;
    }
    if (!files.every(acceptsCs2Photo)) {
      updateColor(color.id, current => ({ ...current, photoError: "photoFormat" }));
      return;
    }
    setPreparingColor(color.id);
    updateColor(color.id, current => ({ ...current, photoError: undefined }));
    try {
      const prepared: ListingDraftPhoto[] = [];
      for (const file of files) {
        prepared.push({ id: crypto.randomUUID(), file: await prepareCs2Photo(file) });
      }
      updateColor(color.id, current => ({ ...current, photos: [...current.photos, ...prepared] }));
    } catch {
      updateColor(color.id, current => ({ ...current, photoError: "photoPrepare" }));
    } finally {
      setPreparingColor(undefined);
    }
  }

  return { productId, values, setValues, colors, setColors, sizeGuide, setSizeGuide, preparingColor, updateColor, appendFields, addPhotos };
}

export function FashionListingFields({ editor, copy, locale, pending }: {
  editor: ReturnType<typeof useFashionListing>;
  copy: FormCopy;
  locale: MarketplaceLocale;
  pending: boolean;
}) {
  const { productId, values, setValues, colors, setColors, sizeGuide, setSizeGuide, preparingColor, updateColor, addPhotos } = editor;
  const labels = fashionSellerDictionaries[locale];
  const photoCopy = { ...cs2SellerDictionaries[locale], photoLimit: labels.photoLimit };
  const id = useId();
  const focusTarget = useRef<string>(undefined);

  useEffect(() => {
    if (focusTarget.current) {
      document.getElementById(focusTarget.current)?.focus();
      focusTarget.current = undefined;
    }
  }, [colors, sizeGuide]);

  const colorInput = (color: string) => `${id}-color-${color}`;
  const sizeInput = (color: string, size: string) => `${id}-color-${color}-size-${size}`;
  const guideInput = (row: string) => `${id}-guide-${row}`;
  const moveFocusTo = (target: string) => { focusTarget.current = target; };
  const change = (key: Exclude<keyof ProductFields, "state">) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { value } = event.target;
    setValues(current => ({ ...current, [key]: value }));
  };
  const guideSizes = Array.from(new Set(colors.flatMap(color => color.sizes.map(({ size }) => size.trim().toUpperCase())).filter(Boolean)));

  return <>
    <input type="hidden" name="fashionProductId" value={productId} />
    <div className={styles.fields}>
      <label>{copy.titleField}<input name="title" value={values.title} onChange={change("title")} maxLength={120} required /></label>
      <label>{copy.category}<input name="category" value={values.category} onChange={change("category")} maxLength={80} required /></label>
    </div>
    <label>{copy.description}<textarea name="description" value={values.description} onChange={change("description")} maxLength={4000} rows={5} required /></label>

    <fieldset className={styles.section}>
      <legend>{labels.details}</legend>
      <div className={styles.fields}>
        <label>{labels.brand}<input name="fashionBrand" value={values.brand} onChange={change("brand")} maxLength={FASHION_MAX_BRAND_LENGTH} /></label>
        <label>{labels.material}<input name="fashionMaterial" value={values.material} onChange={change("material")} maxLength={FASHION_MAX_DETAIL_LENGTH} placeholder={labels.materialExample} /></label>
        <label>{labels.fit}<input name="fashionFit" value={values.fit} onChange={change("fit")} maxLength={FASHION_MAX_DETAIL_LENGTH} placeholder={labels.fitExample} /></label>
        <label>{labels.care}<input name="fashionCare" value={values.care} onChange={change("care")} maxLength={FASHION_MAX_DETAIL_LENGTH} placeholder={labels.careExample} /></label>
      </div>
    </fieldset>

    <label>{copy.price}<input name="price" inputMode="decimal" value={values.price} onChange={change("price")} aria-describedby={`${id}-price-hint`} required /></label>
    <p id={`${id}-price-hint`} className="seller-help">{labels.priceDefaultHint} {copy.priceHint}</p>

    <fieldset className={styles.section} aria-describedby={`${id}-colors-hint`}>
      <legend>{labels.colors}</legend>
      <p id={`${id}-colors-hint`} className={styles.hint}>{labels.colorsHint}</p>
      {colors.map((color, colorIndex) => (
        <fieldset key={color.id} className={styles.color}>
          <legend>{labels.color} {colorIndex + 1}</legend>
          <label>{labels.colorName}
            <input id={colorInput(color.id)} value={color.name} maxLength={FASHION_MAX_COLOR_LENGTH} placeholder={labels.colorExample} required
              onChange={event => {
                const { value } = event.target;
                updateColor(color.id, current => ({ ...current, name: value }));
              }} />
          </label>
          <ListingPhotoPicker
            photos={color.photos}
            maxPhotos={CS2_MAX_PHOTOS}
            photoHref={fileName => fashionPhotoHref(color.id, fileName, true)}
            disabled={preparingColor !== undefined || pending}
            preparing={preparingColor === color.id}
            error={color.photoError}
            copy={photoCopy}
            onAdd={files => void addPhotos(color, files)}
            onRemove={photoId => updateColor(color.id, current => ({
              ...current, photos: current.photos.filter(photo => photo.id !== photoId), photoError: undefined,
            }))}
          />

          {color.sizes.map((row, sizeIndex) => {
            function changeSize(key: "size" | "quantity" | "price", value: string) {
              updateColor(color.id, current => ({
                ...current, sizes: current.sizes.map(size => size.key === row.key ? { ...size, [key]: value } : size),
              }));
            }

            return <fieldset key={row.key} className={styles.size}>
              <legend>{labels.size} {sizeIndex + 1}</legend>
              <div className={styles.sizeFields}>
                <label>{labels.size}
                  <input id={sizeInput(color.id, row.key)} value={row.size} maxLength={FASHION_MAX_SIZE_LENGTH} placeholder={labels.sizeExample} required
                    onChange={event => changeSize("size", event.target.value)} />
                </label>
                <label>{labels.stock}
                  <input type="number" min="0" max="1000000" step="1" value={row.quantity} required
                    onChange={event => changeSize("quantity", event.target.value)} />
                </label>
                <label>{labels.priceOverride}
                  <input inputMode="decimal" value={row.price} aria-describedby={`${id}-price-hint`}
                    onChange={event => changeSize("price", event.target.value)} />
                </label>
              </div>
              {color.sizes.length > 1 && <button type="button" className={styles.secondary} aria-label={`${labels.removeSize} ${sizeIndex + 1}`}
                disabled={pending}
                onClick={() => {
                  moveFocusTo(sizeInput(color.id, (color.sizes[sizeIndex + 1] ?? color.sizes[sizeIndex - 1]).key));
                  updateColor(color.id, current => ({ ...current, sizes: current.sizes.filter(size => size.key !== row.key) }));
                }}>
                {labels.removeSize}
              </button>}
            </fieldset>;
          })}

          <div className={styles.controls}>
            <button type="button" className={styles.secondary} disabled={pending || color.sizes.length >= FASHION_MAX_SIZES}
              onClick={() => {
                const size = newSize(crypto.randomUUID());
                moveFocusTo(sizeInput(color.id, size.key));
                updateColor(color.id, current => ({ ...current, sizes: [...current.sizes, size] }));
              }}>
              {labels.addSize}
            </button>
            {colors.length > 1 && <button type="button" className={styles.secondary} aria-label={`${labels.removeColor} ${colorIndex + 1}`}
              disabled={pending || preparingColor === color.id}
              onClick={() => {
                moveFocusTo(colorInput((colors[colorIndex + 1] ?? colors[colorIndex - 1]).id));
                setColors(current => current.filter(entry => entry.id !== color.id));
              }}>
              {labels.removeColor}
            </button>}
          </div>
        </fieldset>
      ))}
      <button type="button" className={styles.secondary} disabled={pending || colors.length >= FASHION_MAX_COLORS}
        onClick={() => {
          const nextColor = newColor(crypto.randomUUID());
          moveFocusTo(colorInput(nextColor.id));
          setColors(current => [...current, nextColor]);
        }}>
        {labels.addColor}
      </button>
    </fieldset>

    <fieldset className={styles.section} aria-describedby={`${id}-guide-hint`}>
      <legend>{labels.sizeGuide}</legend>
      <p id={`${id}-guide-hint`} className={styles.hint}>{labels.sizeGuideHint}</p>
      {sizeGuide.map((row, index) => (
        <div key={row.key} className={styles.guideRow}>
          <div className={styles.guideFields}>
            <label>{labels.size}
              <select id={guideInput(row.key)} value={guideSizes.includes(row.size) ? row.size : ""} required
                onChange={event => {
                  const { value } = event.target;
                  setSizeGuide(current => current.map(entry => entry.key === row.key ? { ...entry, size: value } : entry));
                }}>
                <option value="" disabled>{labels.chooseSize}</option>
                {guideSizes.map(size => <option key={size} value={size} disabled={size !== row.size && sizeGuide.some(entry => entry.size === size)}>{size}</option>)}
              </select>
            </label>
            <label>{labels.measurements}
              <input value={row.measurements} maxLength={FASHION_MAX_MEASUREMENTS} placeholder={labels.measurementsExample} required
                onChange={event => {
                  const { value } = event.target;
                  setSizeGuide(current => current.map(entry => entry.key === row.key ? { ...entry, measurements: value } : entry));
                }} />
            </label>
          </div>
          <button type="button" className={styles.secondary} disabled={pending} aria-label={`${labels.removeGuideRow} ${index + 1}`}
            onClick={() => {
              const next = sizeGuide[index + 1] ?? sizeGuide[index - 1];
              moveFocusTo(next ? guideInput(next.key) : `${id}-add-guide`);
              setSizeGuide(current => current.filter(entry => entry.key !== row.key));
            }}>
            {labels.removeGuideRow}
          </button>
        </div>
      ))}
      <button type="button" id={`${id}-add-guide`} className={styles.secondary}
        disabled={pending || sizeGuide.length >= FASHION_MAX_GUIDE_ROWS || sizeGuide.length >= guideSizes.length}
        onClick={() => {
          const key = crypto.randomUUID();
          moveFocusTo(guideInput(key));
          setSizeGuide(current => [...current, { key, size: "", measurements: "" }]);
        }}>
        {labels.addGuideRow}
      </button>
    </fieldset>
    <label>{copy.state}
      <select name="state" value={values.state} onChange={event => {
        const state = event.target.value === "published" ? "published" : "draft";
        setValues(current => ({ ...current, state }));
      }}>
        <option value="draft">{copy.draft}</option>
        <option value="published">{copy.published}</option>
      </select>
    </label>
  </>;
}
