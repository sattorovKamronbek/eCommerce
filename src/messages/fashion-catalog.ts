const en = {
  color: "Color",
  size: "Size",
  brand: "Brand",
  material: "Material",
  fit: "Fit",
  care: "Care",
  sizeGuide: "Size guide",
  measurements: "Measurements (cm)",
  soldOut: "Sold out",
  fromPrice: (price: string) => `From ${price}`,
  photos: "Product photos",
  photo: (number: number) => `Photo ${number}`,
  photoAlt: (title: string, number: number, total: number) => `${title}, photo ${number} of ${total}`,
};

const uz: typeof en = {
  color: "Rang",
  size: "O‘lcham",
  brand: "Brend",
  material: "Mato tarkibi",
  fit: "Bichim",
  care: "Parvarish",
  sizeGuide: "O‘lchamlar jadvali",
  measurements: "O‘lchovlar (sm)",
  soldOut: "Sotilib bo‘lgan",
  fromPrice: (price) => `${price} dan`,
  photos: "Mahsulot suratlari",
  photo: (number) => `${number}-surat`,
  photoAlt: (title, number, total) => `${title}, ${total} tadan ${number}-surat`,
};

const ru: typeof en = {
  color: "Цвет",
  size: "Размер",
  brand: "Бренд",
  material: "Состав ткани",
  fit: "Посадка",
  care: "Уход",
  sizeGuide: "Таблица размеров",
  measurements: "Мерки (см)",
  soldOut: "Нет в наличии",
  fromPrice: (price) => `От ${price}`,
  photos: "Фото товара",
  photo: (number) => `Фото ${number}`,
  photoAlt: (title, number, total) => `${title}, фото ${number} из ${total}`,
};

export const fashionCatalogDictionaries = { en, uz, ru };
