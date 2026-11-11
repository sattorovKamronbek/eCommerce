// Development fixtures only. These are not sellable inventory or supplier claims.
export type Category = "home" | "accessories" | "lighting" | "textiles";
export type Product = {
  id: string;
  slug: string;
  name: string;
  category: Category;
  price: number;
  image: string;
  alt: string;
  material: string;
  description: string;
  colors: string[];
  stock: number;
  isNew?: boolean;
};
export const products: Product[] = [
  {
    id: "p1",
    slug: "sokin-keramik-vaza",
    name: "Sokin — keramik vaza",
    category: "home",
    price: 285000,
    image: "/images/vase-editorial.jpg",
    alt: "Tabiiy qum rangidagi keramik vaza",
    material: "Keramika",
    description:
      "Sodda siluet va tabiiy faktura. Tokcha yoki stol ustiga iliqlik olib kiradigan dekorativ buyum. Surat va xususiyatlar namunaviy.",
    colors: ["Qum", "Tosh"],
    stock: 8,
    isNew: true,
  },
  {
    id: "p2",
    slug: "nur-stol-chirogi",
    name: "Nur — stol chirog‘i",
    category: "lighting",
    price: 890000,
    image: "/images/lamp.jpg",
    alt: "Minimal stol chirog‘i",
    material: "Metall, yog‘och",
    description:
      "O‘qish burchagi va ish stoliga mos, aniq chiziqlarga ega yoritgich. Surat va xususiyatlar namunaviy.",
    colors: ["Oq", "Qora"],
    stock: 5,
  },
  {
    id: "p3",
    slug: "forma-kreslo",
    name: "Forma — yumshoq kreslo",
    category: "home",
    price: 2450000,
    image: "/images/chair.jpg",
    alt: "Zamonaviy yumshoq kreslo",
    material: "Mato, yog‘och",
    description:
      "Dam olish uchun o‘ylangan, yumshoq shaklli kreslo. Surat va xususiyatlar namunaviy.",
    colors: ["Och kulrang"],
    stock: 3,
    isNew: true,
  },
  {
    id: "p4",
    slug: "kun-charm-sumka",
    name: "Kun — kundalik sumka",
    category: "accessories",
    price: 650000,
    image: "/images/bag-editorial.jpg",
    alt: "Kundalik charm sumka",
    material: "Charm",
    description:
      "Har kungi zarur buyumlar uchun ixcham shakl. Surat va xususiyatlar namunaviy.",
    colors: ["Karamel", "Qora"],
    stock: 7,
  },
  {
    id: "p5",
    slug: "mayin-yostiq",
    name: "Mayin — dekorativ yostiq",
    category: "textiles",
    price: 195000,
    image: "/images/textile-editorial.jpg",
    alt: "Tabiiy paxtadan dekorativ yostiq",
    material: "Paxta",
    description:
      "Interyerga qo‘shimcha faktura va qulaylik. Surat va xususiyatlar namunaviy.",
    colors: ["Tabiiy"],
    stock: 0,
    isNew: true,
  },
  {
    id: "p6",
    slug: "makon-yon-stol",
    name: "Makon — yon stol",
    category: "home",
    price: 1250000,
    image: "/images/table-editorial.jpg",
    alt: "Tabiiy emandan yumaloq yon stol",
    material: "Yog‘och",
    description:
      "Sevimli kitobingiz va bir piyola choy uchun. Surat va xususiyatlar namunaviy.",
    colors: ["Tabiiy eman"],
    stock: 4,
    isNew: true,
  },
];
export const categories: Category[] = [
  "home",
  "accessories",
  "lighting",
  "textiles",
];
export function getProduct(slug: string) {
  return products.find((p) => p.slug === slug);
}
