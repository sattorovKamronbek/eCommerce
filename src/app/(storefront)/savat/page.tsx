import { copy } from "@/messages";
import { CartContent } from "@/components/cart-content";
export const metadata = { title: "Savatingiz" };
export default function CartPage() {
  return (
    <div className="section page-section">
      <div className="page-heading">
        <h1>{copy.savatingiz}</h1>
      </div>
      <CartContent />
    </div>
  );
}
