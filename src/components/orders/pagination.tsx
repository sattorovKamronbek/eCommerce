import Link from "next/link";
import { accountDictionaries } from "@/messages/account";
import type { MarketplaceLocale } from "@/messages/marketplace";

export function OrderPagination({ locale, page, search, base, hasNext, label }: {
  locale: MarketplaceLocale; page: number; search?: URLSearchParams; base: string; hasNext: boolean; label: string;
}) {
  if (page === 1 && !hasNext) return null;

  const copy = accountDictionaries[locale];
  const href = (n: number) => {
    const query = new URLSearchParams(search);
    if (n > 1) query.set("page", String(n));
    return `${base}${query.size ? `?${query}` : ""}`;
  };
  return <nav className="account-pagination" aria-label={label}>
    {page > 1 ? <Link href={href(page - 1)} rel="prev">{copy.previous}</Link> : <span aria-disabled="true">{copy.previous}</span>}
    <span aria-current="page">{copy.page} {page}</span>
    {hasNext ? <Link href={href(page + 1)} rel="next">{copy.next}</Link> : <span aria-disabled="true">{copy.next}</span>}
  </nav>;
}
