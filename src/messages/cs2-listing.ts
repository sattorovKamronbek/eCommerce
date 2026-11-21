import type { Cs2Category } from "@/lib/sellers/cs2";
import type { MarketplaceLocale } from "./marketplace";

export const cs2Dictionaries: Record<MarketplaceLocale, { categories: Record<Cs2Category, string> }> = {
  en: { categories: {
    pistol: "Pistols", rifle: "Rifles", "sniper-rifle": "Sniper rifles", smg: "SMGs", shotgun: "Shotguns",
    machinegun: "Machine guns", knife: "Knives", gloves: "Gloves", zeus: "Zeus x27",
  } },
  uz: { categories: {
    pistol: "Pistoletlar", rifle: "Miltiqlar", "sniper-rifle": "Snayper miltiqlari", smg: "Pistolet-pulemyotlar",
    shotgun: "Sochma o‘qli miltiqlar", machinegun: "Pulemyotlar", knife: "Pichoqlar", gloves: "Qo‘lqoplar", zeus: "Zeus x27",
  } },
  ru: { categories: {
    pistol: "Пистолеты", rifle: "Винтовки", "sniper-rifle": "Снайперские винтовки", smg: "Пистолеты-пулемёты",
    shotgun: "Дробовики", machinegun: "Пулемёты", knife: "Ножи", gloves: "Перчатки", zeus: "Zeus x27",
  } },
};
