import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { sellerDictionaries } from "@/messages/seller";
import { SellerForm } from "./seller-form";

afterEach(cleanup);

it("retains entered application details when validation fails", async () => {
  const action = vi.fn().mockResolvedValue({ error: "invalid" });
  const { container } = render(<SellerForm action={action} copy={sellerDictionaries.en} />);
  fireEvent.change(screen.getByLabelText("Applicant type"), { target: { value: "company" } });
  fireEvent.change(screen.getByLabelText("Name or company name"), { target: { value: "My company" } });
  fireEvent.change(screen.getByLabelText("Contact details"), { target: { value: "owner@example.test" } });
  fireEvent.change(screen.getByLabelText("Operating region"), { target: { value: "Tashkent" } });
  await act(async () => { fireEvent.submit(container.querySelector("form")!); });
  await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(sellerDictionaries.en.invalid));
  expect(screen.getByLabelText("Applicant type")).toHaveValue("company");
  expect(screen.getByLabelText("Name or company name")).toHaveValue("My company");
  expect(screen.getByLabelText("Contact details")).toHaveValue("owner@example.test");
  expect(screen.getByLabelText("Operating region")).toHaveValue("Tashkent");
});
