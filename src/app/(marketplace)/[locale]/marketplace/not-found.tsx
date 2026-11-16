"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { isMarketplaceLocale, marketplaceDictionaries } from "@/messages/marketplace";
import { marketplaceConfig } from "@/lib/config";

export default function MarketplaceNotFound() {
  const params = useParams();
  const locale = typeof params.locale === "string" && isMarketplaceLocale(params.locale) ? params.locale : marketplaceConfig.defaultLocale;
  const copy = marketplaceDictionaries[locale];
  return <div className="mp-catalog mp-info"><p>404</p><h1>{copy.notFoundTitle}</h1><p>{copy.notFoundBody}</p><Link className="mp-text-link" href={`/${locale}/marketplace`}>{copy.discover}</Link></div>;
}
