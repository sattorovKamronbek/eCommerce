import { notFound } from "next/navigation";
import { isMarketplaceLocale, marketplaceDictionaries } from "@/messages/marketplace";

export default async function HowItWorks({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isMarketplaceLocale(locale)) notFound();
  const copy = marketplaceDictionaries[locale];
  return <div className="mp-catalog mp-info"><h1>{copy.buyingTitle}</h1><p className="mp-catalog-intro">{copy.buyingIntro}</p><section><h2>{copy.cs2}</h2><p>{copy.cs2Plan}</p></section><section><h2>{copy.fashion}</h2><p>{copy.fashionPlan}</p></section><p>{copy.planNote}</p></div>;
}
