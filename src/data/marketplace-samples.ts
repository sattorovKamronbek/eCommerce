// Development illustrations only: these are neither seller listings nor inventory.
export type Ecosystem = "cs2" | "fashion";
export type SampleType = "rifle" | "knife" | "outerwear" | "overshirt";
export type SampleKey = "violet-rifle" | "steel-knife" | "night-rifle" | "olive-puffer" | "sand-overshirt" | "studio-puffer";

export type MarketplaceSample = {
  id: SampleKey;
  ecosystem: Ecosystem;
  type: SampleType;
  image: string;
  samplePriceUzs: number;
  sizes: readonly string[];
};

export const marketplaceSamples: readonly MarketplaceSample[] = [
  { id: "violet-rifle", ecosystem: "cs2", type: "rifle", image: "/images/marketplace/rifle.png", samplePriceUzs: 125000, sizes: [] },
  { id: "steel-knife", ecosystem: "cs2", type: "knife", image: "/images/marketplace/knife.png", samplePriceUzs: 280000, sizes: [] },
  { id: "night-rifle", ecosystem: "cs2", type: "rifle", image: "/images/marketplace/rifle.png", samplePriceUzs: 195000, sizes: [] },
  { id: "olive-puffer", ecosystem: "fashion", type: "outerwear", image: "/images/marketplace/puffer.png", samplePriceUzs: 650000, sizes: ["S", "M", "L", "XL"] },
  { id: "sand-overshirt", ecosystem: "fashion", type: "overshirt", image: "/images/marketplace/overshirt.png", samplePriceUzs: 390000, sizes: ["S", "M", "L"] },
  { id: "studio-puffer", ecosystem: "fashion", type: "outerwear", image: "/images/marketplace/puffer.png", samplePriceUzs: 720000, sizes: ["M", "L", "XL"] },
];
