import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { listingDictionaries } from "@/messages/seller-catalog";
import { ListingForm } from "./listing-form";

afterEach(cleanup);

it("keeps seller-entered listing details when the server rejects them", async () => {
  const action = vi.fn().mockResolvedValue({ error: "invalid" });
  const { container } = render(<ListingForm action={action} copy={listingDictionaries.en} scope="both" />);
  fireEvent.change(screen.getByLabelText(listingDictionaries.en.titleField), { target: { value: "My jacket" } });
  fireEvent.change(screen.getByLabelText(listingDictionaries.en.price), { target: { value: "100.50" } });
  await act(async () => { fireEvent.submit(container.querySelector("form")!); });
  await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(listingDictionaries.en.invalid));
  expect(screen.getByLabelText(listingDictionaries.en.titleField)).toHaveValue("My jacket");
  expect(screen.getByLabelText(listingDictionaries.en.price)).toHaveValue("100.50");
});
