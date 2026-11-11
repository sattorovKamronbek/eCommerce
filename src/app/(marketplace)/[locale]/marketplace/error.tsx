"use client";
import { useParams } from "next/navigation";
import { isMarketplaceLocale, marketplaceDictionaries } from "@/messages/marketplace";
import { marketplaceConfig } from "@/lib/config";
import { Button } from "@/components/ui/button";
export default function MarketplaceError({ reset }: { reset: () => void }) {
  const params = useParams();
  const locale = typeof params.locale === "string" && isMarketplaceLocale(params.locale) ? params.locale : marketplaceConfig.defaultLocale;
  const copy = marketplaceDictionaries[locale];
  return <div className="mp-catalog mp-info" role="alert"><h1>{copy.error}</h1><Button onClick={reset}>{copy.retry}</Button></div>;
}
