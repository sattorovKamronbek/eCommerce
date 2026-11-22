import Link from "next/link";
import { AccountShell, AccountUnavailable, SellerSetupRequired } from "@/components/account/shell";
import { loadSellerIntake } from "@/lib/sellers/intake";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listingDictionaries } from "@/messages/seller-catalog";
import { sellerDictionaries } from "@/messages/seller";
import type { MarketplaceLocale } from "@/messages/marketplace";

export async function SellerAccessNotice({ locale, kind }: { locale: MarketplaceLocale; kind: "unavailable" | "denied" | "mfa" | "setup" }) {
  const copy = listingDictionaries[locale];
  if (kind === "setup") return <SellerSetupRequired locale={locale} />;
  if (kind === "unavailable") return <AccountUnavailable locale={locale} />;
  if (kind === "mfa") return <AccountShell locale={locale} title={copy.products} intro={copy.requireMfa}>
    <Link className="mp-text-link" href={`/${locale}/account/security?next=${encodeURIComponent(`/${locale}/seller/products`)}`}>{copy.verify}</Link>
  </AccountShell>;

  const client = await createServerSupabaseClient();
  const intake = client ? await loadSellerIntake(client) : null;
  return <AccountShell locale={locale} title={copy.products} intro={copy.requireApproval}>
    {intake?.has_application && <Link className="mp-text-link" href={`/${locale}/seller/apply`} prefetch={false}>
      {sellerDictionaries[locale].status}
    </Link>}
  </AccountShell>;
}
