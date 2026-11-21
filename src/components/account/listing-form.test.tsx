import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import type { ListingActionState } from "@/lib/sellers/listing";
import type { SellerListing } from "@/lib/supabase/database";
import { listingDictionaries } from "@/messages/seller-catalog";
import { ListingForm } from "./listing-form";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const copy = listingDictionaries.en;
const submissionId = "60f572b3-ebc8-4401-9a4c-fd05b9ec5ad8";
type ListingAction = (state: ListingActionState, form: FormData) => Promise<ListingActionState>;

it("keeps seller-entered listing details when the server rejects them", async () => {
  const action = vi.fn().mockResolvedValue({ error: "invalid" });
  const { container } = render(<ListingForm action={action} copy={copy} locale="en" scope="both" submissionId={submissionId} />);
  fireEvent.change(screen.getByLabelText(copy.ecosystem), { target: { value: "fashion" } });
  fireEvent.change(screen.getByLabelText(copy.titleField), { target: { value: "My jacket" } });
  fireEvent.change(screen.getByLabelText(copy.price), { target: { value: "100.50" } });
  await act(async () => { fireEvent.submit(container.querySelector("form")!); });
  await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(copy.invalid));
  expect(screen.getByLabelText(copy.titleField)).toHaveValue("My jacket");
  expect(screen.getByLabelText(copy.price)).toHaveValue("100.50");
});

it("clears the CS2 model when the seller changes category", () => {
  render(<ListingForm action={vi.fn()} copy={copy} locale="en" scope="cs2" submissionId={submissionId} />);
  const category = screen.getByLabelText(copy.category);
  const model = screen.getByLabelText("Model");
  expect(model).toBeDisabled();
  fireEvent.change(category, { target: { value: "rifle" } });
  fireEvent.change(model, { target: { value: "AK-47" } });
  expect(model).toHaveValue("AK-47");
  fireEvent.change(category, { target: { value: "pistol" } });
  expect(model).toHaveValue("");
  expect(screen.queryByRole("option", { name: "AK-47" })).toBeNull();
  expect(screen.getByRole("option", { name: "Desert Eagle" })).toBeInTheDocument();
});

it("submits only the selected wear prices and keeps the CS2 draft after rejection", async () => {
  const action = vi.fn<ListingAction>().mockResolvedValue({ error: "invalid" });
  const { container } = render(<ListingForm action={action} copy={copy} locale="en" scope="cs2" submissionId={submissionId} />);
  fireEvent.change(screen.getByLabelText(copy.category), { target: { value: "rifle" } });
  fireEvent.change(screen.getByLabelText("Model"), { target: { value: "AK-47" } });
  fireEvent.change(screen.getByLabelText("Skin name"), { target: { value: "Redline" } });
  fireEvent.change(screen.getByLabelText(copy.description), { target: { value: "Item available today" } });
  fireEvent.click(screen.getByRole("checkbox", { name: /Factory New/ }));
  fireEvent.change(container.querySelector('[name="cs2Price-FN"]')!, { target: { value: "100.50" } });
  fireEvent.click(screen.getByRole("checkbox", { name: /Field-Tested/ }));
  fireEvent.change(container.querySelector('[name="cs2Price-FT"]')!, { target: { value: "75" } });
  fireEvent.click(screen.getByRole("checkbox", { name: /Field-Tested/ }));
  await act(async () => { fireEvent.submit(container.querySelector("form")!); });

  const submitted = action.mock.calls[0][1];
  expect(submitted.get("cs2SubmissionId")).toBe(submissionId);
  expect(submitted.get("ecosystem")).toBe("cs2");
  expect(submitted.get("cs2Category")).toBe("rifle");
  expect(submitted.get("cs2Model")).toBe("AK-47");
  expect(submitted.get("title")).toBe("Redline");
  expect(submitted.get("description")).toBe("Item available today");
  expect(submitted.getAll("cs2Wear")).toEqual(["FN"]);
  expect(submitted.get("cs2Price-FN")).toBe("100.50");
  expect(submitted.has("cs2Price-FT")).toBe(false);
  expect(screen.getByRole("alert")).toHaveFocus();
  expect(screen.getByLabelText("Skin name")).toHaveValue("Redline");
  expect(screen.getByRole("checkbox", { name: /Factory New/ })).toBeChecked();
  expect(container.querySelector('[name="cs2Price-FN"]')).toHaveValue("100.50");
  fireEvent.click(screen.getByRole("checkbox", { name: /Field-Tested/ }));
  expect(container.querySelector('[name="cs2Price-FT"]')).toHaveValue("75");
});

it("offers Not Painted separately from painted wears", () => {
  render(<ListingForm action={vi.fn()} copy={copy} locale="en" scope="cs2" submissionId={submissionId} />);
  const factoryNew = screen.getByRole("checkbox", { name: /Factory New/ });
  const unpainted = screen.getByRole("checkbox", { name: "Not Painted" });
  fireEvent.click(factoryNew);
  fireEvent.click(unpainted);
  expect(factoryNew).not.toBeChecked();
  expect(unpainted).toBeChecked();
  fireEvent.click(factoryNew);
  expect(unpainted).not.toBeChecked();
  expect(factoryNew).toBeChecked();
});

it("shows a saving label while the listing action is pending", async () => {
  let finish: (state: ListingActionState) => void = () => { throw new Error("Save did not start"); };
  const action = vi.fn<ListingAction>().mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  const { container } = render(<ListingForm action={action} copy={copy} locale="en" scope="cs2" submissionId={submissionId} />);
  fireEvent.click(screen.getByRole("checkbox", { name: /Factory New/ }));
  await act(async () => { fireEvent.submit(container.querySelector("form")!); });
  expect(screen.getByRole("button", { name: "Saving listing…" })).toBeDisabled();
  await act(async () => finish({ error: "invalid" }));
  expect(screen.getByRole("button", { name: copy.save })).toBeEnabled();
});

const typedListing: SellerListing = {
  id: "28604d33-025c-4bf8-b966-e98561cdfb09",
  seller_id: "220d359c-6e79-40a1-94fb-820a16818a55",
  seller_revision: 2, ecosystem: "cs2", title: "AK-47 | Redline", description: "Original description",
  category: "rifles", variant: "Field-Tested", price_tiyin: 7500, quantity: 1,
  state: "published", moderation_status: "allowed", created_at: "2026-11-21T00:00:00Z", updated_at: "2026-11-21T00:00:00Z",
  cs2_group_id: submissionId, cs2_group_primary: true, cs2_category: "rifle", cs2_model: "AK-47", cs2_wear: "FT",
  cs2_images: ["c9c5e1ef-9c3a-40e6-b7ba-cc355dcbbbb1.webp", "3d50d6a8-d161-43ee-9f6a-1ebf2d01a5d2.webp"],
};

it("keeps edited CS2 stock and photo removals after the server rejects the edit", async () => {
  const action = vi.fn<ListingAction>().mockResolvedValue({ error: "changed" });
  const { container } = render(<ListingForm action={action} copy={copy} locale="en" scope="cs2" listing={typedListing} />);
  expect(screen.queryByRole("checkbox")).toBeNull();
  expect(screen.queryByLabelText("Model")).toBeNull();
  expect(screen.getByText("AK-47")).toBeInTheDocument();
  expect(screen.getByText("Redline")).toBeInTheDocument();
  expect(screen.getByText(/Field-Tested/)).toBeInTheDocument();
  expect(screen.getByRole("spinbutton", { name: copy.quantity })).toHaveAttribute("max", "1");
  fireEvent.change(screen.getByLabelText(copy.quantity), { target: { value: "0" } });
  fireEvent.change(screen.getByLabelText(copy.price), { target: { value: "99" } });
  fireEvent.click(screen.getByRole("button", { name: "Remove photo 1" }));
  await act(async () => { fireEvent.submit(container.querySelector("form")!); });

  const submitted = action.mock.calls[0][1];
  expect(submitted.get("quantity")).toBe("0");
  expect(submitted.get("cs2Price-FT")).toBe("99");
  expect(submitted.getAll("cs2Keep-FT")).toEqual(["3d50d6a8-d161-43ee-9f6a-1ebf2d01a5d2.webp"]);
  expect(screen.getByLabelText(copy.quantity)).toHaveValue(0);
  expect(screen.getByLabelText(copy.price)).toHaveValue("99");
  expect(screen.getAllByRole("button", { name: /Remove photo/ })).toHaveLength(1);
});

it("prepares photo files once, submits them under their own wear, and keeps them after rejection", async () => {
  const action = vi.fn<ListingAction>().mockResolvedValue({ error: "invalid" });
  const { container } = render(<ListingForm action={action} copy={copy} locale="en" scope="cs2" submissionId={submissionId} />);
  fireEvent.click(screen.getByRole("checkbox", { name: /Factory New/ }));
  fireEvent.click(screen.getByRole("checkbox", { name: /Field-Tested/ }));
  vi.stubGlobal("createImageBitmap", vi.fn().mockResolvedValue({ width: 2500, height: 1250, close: vi.fn() }));
  vi.stubGlobal("URL", class extends URL {
    static createObjectURL = vi.fn(() => "blob:preview");
    static revokeObjectURL = vi.fn();
  });
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({ drawImage: vi.fn() } as unknown as CanvasRenderingContext2D);
  const finishEncoding: BlobCallback[] = [];
  vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(function (this: HTMLCanvasElement, callback, type) {
    expect([this.width, this.height, type]).toEqual([1280, 640, "image/webp"]);
    finishEncoding.push(callback);
  });
  const photo = new File(["original image"], "listing.png", { type: "image/png" });
  const [factoryPhotos, fieldPhotos] = screen.getAllByLabelText("Photos");
  fireEvent.change(factoryPhotos, { target: { files: [photo] } });
  expect(screen.getByRole("button", { name: copy.save })).toBeDisabled();
  await waitFor(() => expect(finishEncoding).toHaveLength(1));
  await act(async () => finishEncoding[0](new Blob(["compressed"], { type: "image/webp" })));
  expect(screen.getByRole("button", { name: copy.save })).toBeEnabled();
  fireEvent.change(fieldPhotos, { target: { files: [photo] } });
  await waitFor(() => expect(finishEncoding).toHaveLength(2));
  await act(async () => finishEncoding[1](new Blob(["variant image"], { type: "image/webp" })));
  expect(screen.getAllByRole("button", { name: "Remove photo 1" })).toHaveLength(2);

  await act(async () => { fireEvent.submit(container.querySelector("form")!); });
  const submitted = action.mock.calls[0][1];
  const [factoryPhoto] = submitted.getAll("cs2Photo-FN") as File[];
  const [fieldPhoto] = submitted.getAll("cs2Photo-FT") as File[];
  expect([factoryPhoto.type, factoryPhoto.size]).toEqual(["image/webp", 10]);
  expect([fieldPhoto.type, fieldPhoto.size]).toEqual(["image/webp", 13]);
  expect(finishEncoding).toHaveLength(2);
  expect(screen.getAllByRole("button", { name: "Remove photo 1" })).toHaveLength(2);
});

it("keeps the original fields when editing a legacy CS2 listing", () => {
  const listing: SellerListing = { ...typedListing, cs2_group_id: null, cs2_group_primary: false, cs2_category: null, cs2_model: null, cs2_wear: null, cs2_images: [] };
  render(<ListingForm action={vi.fn()} copy={copy} locale="en" scope="cs2" listing={listing} />);
  expect(screen.getByLabelText(copy.variant)).toHaveValue("Field-Tested");
  expect(screen.getByLabelText(copy.price)).toHaveValue("75.00");
});
