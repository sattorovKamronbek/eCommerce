import { CS2_WEAR_NAMES, type Cs2Wear } from "@/lib/sellers/cs2";
import type { MarketplaceLocale } from "./marketplace";

const en = {
  anyCategory: "All categories",
  model: "Model",
  anyModel: "All models",
  chooseCategory: "Choose a category first",
  wear: "Wear",
  anyWear: "All wear conditions",
  variants: "Wear variants",
  photos: "Listing photos",
  photo: (number: number) => `Photo ${number}`,
  photoAlt: (title: string, number: number, total: number) => `${title}, photo ${number} of ${total}`,
  wearNames: CS2_WEAR_NAMES,
};

const uz: typeof en = {
  anyCategory: "Barcha toifalar",
  model: "Model",
  anyModel: "Barcha modellar",
  chooseCategory: "Avval toifani tanlang",
  wear: "Eskirish darajasi",
  anyWear: "Barcha eskirish darajalari",
  variants: "Eskirish variantlari",
  photos: "E’lon suratlari",
  photo: (number) => `${number}-surat`,
  photoAlt: (title, number, total) => `${title}, ${total} tadan ${number}-surat`,
  wearNames: {
    FN: "Zavoddan chiqqan",
    MW: "Biroz eskirgan",
    FT: "Sinovdan o‘tgan",
    WW: "Ancha eskirgan",
    BS: "Jangda shikastlangan",
    NP: "Bo‘yalmagan",
  },
};

const ru: typeof en = {
  anyCategory: "Все категории",
  model: "Модель",
  anyModel: "Все модели",
  chooseCategory: "Сначала выберите категорию",
  wear: "Износ",
  anyWear: "Любой износ",
  variants: "Варианты износа",
  photos: "Фото объявления",
  photo: (number) => `Фото ${number}`,
  photoAlt: (title, number, total) => `${title}, фото ${number} из ${total}`,
  wearNames: {
    FN: "Прямо с завода",
    MW: "Немного поношенное",
    FT: "После полевых испытаний",
    WW: "Поношенное",
    BS: "Закалённое в боях",
    NP: "Без окраски",
  },
};

export const cs2CatalogDictionaries = { en, uz, ru };

export function formatCs2Wear(locale: MarketplaceLocale, wear: Cs2Wear) {
  return `${wear} · ${cs2CatalogDictionaries[locale].wearNames[wear]}`;
}
