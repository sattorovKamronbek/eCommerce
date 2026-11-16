import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, it, expect } from "vitest";
import { ProductPurchase } from "./product-purchase";
import { products } from "@/data/products";
import { useShop } from "@/stores/shop";
afterEach(cleanup);
beforeEach(() => useShop.setState({ items: [], wishlist: [] }));
it("adds the selected quantity and reports success", () => {
  render(<ProductPurchase product={products[0]} />);
  fireEvent.change(screen.getByLabelText("Miqdor"), { target: { value: "2" } });
  fireEvent.click(screen.getByRole("button", { name: "Savatga qo‘shish" }));
  expect(useShop.getState().items[0].quantity).toBe(2);
  expect(screen.getByRole("status")).toHaveTextContent("Savatga qo‘shildi");
});
it("disables out of stock purchase", () => {
  render(<ProductPurchase product={products[4]} />);
  expect(screen.getByRole("button")).toBeDisabled();
});

it("normalizes fractional input before reporting a successful addition", () => {
  render(<ProductPurchase product={products[0]} />);
  fireEvent.change(screen.getByLabelText("Miqdor"), {
    target: { value: "1.5" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Savatga qo‘shish" }));
  expect(useShop.getState().items[0].quantity).toBe(1);
});
