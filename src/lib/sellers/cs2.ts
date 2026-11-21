import { isUuid } from "@/lib/uuid";

export const CS2_CATEGORIES = ["pistol", "rifle", "sniper-rifle", "smg", "shotgun", "machinegun", "knife", "gloves", "zeus"] as const;
export type Cs2Category = (typeof CS2_CATEGORIES)[number];

export const CS2_MODELS: Record<Cs2Category, readonly string[]> = {
  pistol: ["CZ75-Auto", "Desert Eagle", "Dual Berettas", "Five-SeveN", "Glock-18", "P2000", "P250", "R8 Revolver", "Tec-9", "USP-S"],
  rifle: ["AK-47", "AUG", "FAMAS", "Galil AR", "M4A1-S", "M4A4", "SG 553"],
  "sniper-rifle": ["AWP", "G3SG1", "SCAR-20", "SSG 08"],
  smg: ["MAC-10", "MP5-SD", "MP7", "MP9", "P90", "PP-Bizon", "UMP-45"],
  shotgun: ["MAG-7", "Nova", "Sawed-Off", "XM1014"],
  machinegun: ["M249", "Negev"],
  knife: ["Bayonet", "Bowie Knife", "Butterfly Knife", "Classic Knife", "Falchion Knife", "Flip Knife", "Gut Knife", "Huntsman Knife", "Karambit", "Kukri Knife", "M9 Bayonet", "Navaja Knife", "Nomad Knife", "Paracord Knife", "Shadow Daggers", "Skeleton Knife", "Stiletto Knife", "Survival Knife", "Talon Knife", "Ursus Knife"],
  gloves: ["Bloodhound Gloves", "Broken Fang Gloves", "Driver Gloves", "Hand Wraps", "Hydra Gloves", "Moto Gloves", "Specialist Gloves", "Sport Gloves"],
  zeus: ["Zeus x27"],
};

export const CS2_WEAR = ["FN", "MW", "FT", "WW", "BS", "NP"] as const;
export type Cs2Wear = (typeof CS2_WEAR)[number];
export const CS2_WEAR_NAMES: Record<Cs2Wear, string> = {
  FN: "Factory New",
  MW: "Minimal Wear",
  FT: "Field-Tested",
  WW: "Well-Worn",
  BS: "Battle-Scarred",
  NP: "Not Painted",
};

export const CS2_MAX_PHOTOS = 4;
export const CS2_MAX_PHOTO_BYTES = 160 * 1024;
export const CS2_MAX_PHOTO_DIMENSION = 1280;
export const CS2_PHOTO_BUCKET = "marketplace-cs2-images";

export function isCs2Category(value: unknown): value is Cs2Category {
  return CS2_CATEGORIES.some(category => category === value);
}

export function isCs2Model(category: Cs2Category, value: unknown): value is string {
  return typeof value === "string" && CS2_MODELS[category].includes(value);
}

export function isCs2Wear(value: unknown): value is Cs2Wear {
  return CS2_WEAR.some(wear => wear === value);
}

export function isCs2PhotoName(value: unknown): value is string {
  return typeof value === "string" && value.endsWith(".webp") && isUuid(value.slice(0, -5));
}

export function cs2PhotoHref(id: string, file: string, preview = false) {
  return `/listing-images/${encodeURIComponent(id)}/${encodeURIComponent(file)}${preview ? "?preview=1" : ""}`;
}
