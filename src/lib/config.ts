export const storeConfig = {
  name: "VERSAX",
  brand: {
    logo: { src: "/images/brand/versax.webp", width: 800, height: 155 },
    compactLogo: { src: "/images/brand/versax-compact.webp", width: 440, height: 65 },
    icon: "/icon.png",
  },
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
