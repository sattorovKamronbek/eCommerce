"use client";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { accountDictionaries } from "@/messages/account";
import { isMarketplaceLocale, marketplaceDictionaries } from "@/messages/marketplace";
import "@/components/account/styles.css";
export default function AccountError({ reset }: { reset: () => void }) {
  const params = useParams();
  const locale = typeof params.locale === "string" && isMarketplaceLocale(params.locale) ? params.locale : "uz";
  const copy = accountDictionaries[locale];
  return <section className="account-shell"><h1>{copy.unavailableTitle}</h1><p>{copy.unavailableBody}</p><Button onClick={reset}>{marketplaceDictionaries[locale].retry}</Button></section>;
}
