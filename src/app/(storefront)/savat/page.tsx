import { copy } from "@/messages";
import { CartContent } from "@/components/cart-content";
import "@/components/marketplace/tokens.css";
import "@/components/marketplace/storefront-commerce.css";

export const metadata = { title: copy.savatingiz };
export default function CartPage() {
  return (
    <div className="storefront-commerce">
      <div className="section page-section">
        <div className="page-heading">
          <p className="eyebrow">{copy.namunaviyMahalliySavat}</p>
          <h1>{copy.savatingiz}</h1>
        </div>
        <CartContent />
      </div>
    </div>
  );
}
