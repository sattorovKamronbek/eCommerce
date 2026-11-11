export const storeConfig = {
  name: "ORO",
  locale: "uz-UZ",
  currency: "UZS",
  catalogMode: "development",
} as const;

export const marketplaceConfig = {
  defaultLocale: "uz",
  locales: ["uz", "ru", "en"],
  mode: "development",
  sampleCurrency: "UZS",
} as const;
