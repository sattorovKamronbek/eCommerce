import { copy } from "@/messages";
import Link from "next/link";
import "@/components/marketplace/tokens.css";
import "@/components/marketplace/storefront-commerce.css";

export const metadata = { title: copy.checkoutHaqida };
export default function Checkout() {
  return (
    <div className="storefront-commerce">
      <div className="section page-section info-page">
        <p className="eyebrow">{copy.ishlabChiqishRejimi}</p>
        <h1>{copy.buyurtmaBerishTezOrada}</h1>
        <p>{copy.buDokonningDizaynVaKatalogBosqichi}</p>
        <p>{copy.haqiqiyCheckoutServerNarxlariPostgresqlBuyurtmalari}</p>
        <Link href="/savat" className="text-link">
          {copy.savatgaQaytish}
        </Link>
      </div>
    </div>
  );
}
