import { isUuid } from "@/lib/uuid";
import { randomUUID } from "node:crypto";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AccountShell, AccountUnavailable, accountLocale } from "@/components/account/shell";
import { ActionForm } from "@/components/account/action-form";
import { requireAccount } from "@/lib/auth/access";
import { formatTiyin } from "@/lib/orders/model";
import { orderDictionaries } from "@/messages/orders";
import { listingDictionaries } from "@/messages/seller-catalog";
import { reserveOrder } from "../../../orders/actions";

export default async function Checkout({ params }: { params: Promise<{ locale: string; ecosystem: string; id: string }> }) {
  const input = await params;
  const locale = await accountLocale(params);
  const { ecosystem, id } = input;
  if ((ecosystem !== "cs2" && ecosystem !== "fashion") || !isUuid(id)) notFound();
  const account = await requireAccount(locale, `/${locale}/account/checkout/${ecosystem}/${id}`);
  if (!account) return <AccountUnavailable locale={locale} />;
  const copy = orderDictionaries[locale];
  const result = await account.client.from("marketplace_checkout_offers").select("*").eq("listing_id", id).eq("ecosystem", ecosystem).maybeSingle();
  const offer = result.data;
  if (!offer) return <AccountShell locale={locale} title={copy.checkout} intro={copy.offerUnavailable}>
    <Link className="mp-text-link" href={`/${locale}/listings/${ecosystem}/${id}`}>{listingDictionaries[locale].back}</Link>
  </AccountShell>;

  return <AccountShell locale={locale} title={copy.checkout} intro={copy.checkoutIntro}>
    <section className="order-summary">
      <h2>{offer.title}</h2>
      <p className="real-description">{offer.description}</p>
      {offer.category || offer.variant ? <p>{[offer.category, offer.variant].filter(Boolean).join(" · ")}</p> : null}
      <dl className="order-facts">
        <div><dt>{copy.unitPrice}</dt><dd>{formatTiyin(offer.price_tiyin, locale)}</dd></div>
        {ecosystem === "fashion" ? <div><dt>{copy.shipping}</dt><dd>{formatTiyin(offer.shipping_tiyin, locale)}</dd></div> : null}
      </dl>
    </section>
    <ActionForm action={reserveOrder.bind(null, locale, ecosystem, id, randomUUID(), offer.quote)}
      label={copy.checkout} errors={copy.feedback} pendingLabel={copy.pending}>
      {ecosystem === "fashion" ? <>
        <label>{copy.quantity}<input name="quantity" required type="number" min="1" max="1000000" defaultValue="1" /></label>
        <label>{copy.name}<input name="name" required autoComplete="shipping name" maxLength={120} /></label>
        <label>{copy.phone}<input name="phone" required type="tel" autoComplete="shipping tel" placeholder="+998901234567" maxLength={16} /></label>
        <label>{copy.address}<input name="address" required autoComplete="shipping street-address" minLength={5} maxLength={500} /></label>
      </> : null}
    </ActionForm>
  </AccountShell>;
}
