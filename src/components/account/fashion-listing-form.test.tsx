import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import type { FashionFormValues } from "@/lib/sellers/fashion";
import type { ListingActionState } from "@/lib/sellers/listing";
import { listingDictionaries } from "@/messages/seller-catalog";
import { ListingForm } from "./listing-form";

const copy = listingDictionaries.en;
const productId = "60f572b3-ebc8-4401-9a4c-fd05b9ec5ad8";
const otherColorId = "bc7c3db3-a7bc-463a-9602-d65eab737602";
type Action = (state: ListingActionState, form: FormData) => Promise<ListingActionState>;

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it("sends independent clothing stock and pricing for each offered color and size", async () => {
  const action = vi.fn<Action>().mockResolvedValue({ error: "invalid" });
  const { container } = render(<ListingForm action={action} copy={copy} locale="en" scope="fashion" submissionId={productId} />);
  fireEvent.change(screen.getByLabelText(copy.titleField), { target: { value: "Polo shirt" } });
  fireEvent.change(screen.getByLabelText(copy.category), { target: { value: "Shirts" } });
  fireEvent.change(screen.getByLabelText(copy.description), { target: { value: "Textured cotton polo" } });
  fireEvent.change(screen.getByLabelText("Material"), { target: { value: "Cotton" } });
  fireEvent.change(screen.getByLabelText(copy.price), { target: { value: "125000" } });
  fireEvent.change(screen.getByLabelText(copy.state), { target: { value: "published" } });

  const black = within(screen.getByText("Color 1", { selector: "legend" }).closest("fieldset")!);
  fireEvent.change(black.getByLabelText("Color name"), { target: { value: "Black" } });
  fireEvent.change(black.getByLabelText("Size"), { target: { value: "M" } });
  fireEvent.change(black.getByLabelText("Stock"), { target: { value: "3" } });
  fireEvent.click(black.getByText("Add size", { selector: "button" }));
  const blackLarge = within(black.getByText("Size 2", { selector: "legend" }).closest("fieldset")!);
  expect(blackLarge.getByLabelText("Size")).toHaveFocus();
  fireEvent.change(blackLarge.getByLabelText("Size"), { target: { value: "L" } });
  fireEvent.change(blackLarge.getByLabelText("Stock"), { target: { value: "0" } });
  fireEvent.change(blackLarge.getByLabelText("Price override in UZS"), { target: { value: "150000" } });

  fireEvent.click(screen.getByText("Add color", { selector: "button" }));
  const white = within(screen.getByText("Color 2", { selector: "legend" }).closest("fieldset")!);
  fireEvent.change(white.getByLabelText("Color name"), { target: { value: "White" } });
  fireEvent.change(white.getByLabelText("Size"), { target: { value: "M" } });
  fireEvent.change(white.getByLabelText("Stock"), { target: { value: "6" } });

  fireEvent.click(screen.getByText("Add size guide row", { selector: "button" }));
  const guide = within(screen.getByText("Size guide (optional)", { selector: "legend" }).closest("fieldset")!);
  fireEvent.change(guide.getByLabelText("Size"), { target: { value: "M" } });
  fireEvent.change(guide.getByLabelText("Measurements in cm"), { target: { value: "Chest 96, length 66" } });

  await act(async () => { fireEvent.submit(container.querySelector("form")!); });

  const submitted = action.mock.calls[0][1];
  expect(submitted.get("ecosystem")).toBe("fashion");
  expect(submitted.get("fashionProductId")).toBe(productId);
  expect(submitted.get("title")).toBe("Polo shirt");
  expect(submitted.get("fashionMaterial")).toBe("Cotton");
  expect(submitted.get("price")).toBe("125000");
  expect(submitted.get("state")).toBe("published");
  expect(JSON.parse(String(submitted.get("fashionPayload")))).toEqual({
    colors: [
      { id: productId, name: "Black", sizes: [{ size: "M", quantity: "3", price: "" }, { size: "L", quantity: "0", price: "150000" }] },
      { id: expect.any(String), name: "White", sizes: [{ size: "M", quantity: "6", price: "" }] },
    ],
    sizeGuide: [{ size: "M", measurements: "Chest 96, length 66" }],
  });
  expect(submitted.has("cs2SubmissionId")).toBe(false);
  expect(screen.getByText(copy.invalid, { selector: '[role="alert"]' })).toHaveFocus();
  expect(screen.getByLabelText(copy.titleField)).toHaveValue("Polo shirt");
});

it("retains separate clothing and CS2 drafts when a seller switches marketplaces", () => {
  render(<ListingForm action={vi.fn()} copy={copy} locale="en" scope="both" submissionId={productId} />);
  const marketplace = screen.getByLabelText(copy.ecosystem);
  fireEvent.change(screen.getByLabelText("Skin name"), { target: { value: "CS2 draft" } });
  fireEvent.change(marketplace, { target: { value: "fashion" } });
  fireEvent.change(screen.getByLabelText("Color name"), { target: { value: "Blue" } });
  fireEvent.change(marketplace, { target: { value: "cs2" } });
  expect(screen.getByLabelText("Skin name")).toHaveValue("CS2 draft");
  expect(screen.queryByLabelText("Color name")).toBeNull();
  fireEvent.change(marketplace, { target: { value: "fashion" } });
  expect(screen.getByLabelText("Color name")).toHaveValue("Blue");
});

it("keeps only the existing photos and combinations still offered by the edited product", async () => {
  const keep = "c9c5e1ef-9c3a-40e6-b7ba-cc355dcbbbb1.webp";
  const remove = "3d50d6a8-d161-43ee-9f6a-1ebf2d01a5d2.webp";
  const fashion: FashionFormValues = {
    productId, title: "Polo shirt", description: "Textured cotton polo", category: "Shirts",
    brand: "", material: "Cotton", fit: "Regular", care: "Wash cold", price: "125000", state: "draft",
    colors: [
      { id: productId, name: "Black", images: [remove, keep], sizes: [{ size: "M", quantity: "3", price: "" }, { size: "L", quantity: "2", price: "" }] },
      { id: otherColorId, name: "White", images: [remove], sizes: [{ size: "M", quantity: "1", price: "" }] },
    ], sizeGuide: [],
  };
  const action = vi.fn<Action>().mockResolvedValue({ error: "invalid" });
  const { container } = render(<ListingForm action={action} copy={copy} locale="en" scope="both" fashion={fashion} />);
  const black = within(screen.getByText("Color 1", { selector: "legend" }).closest("fieldset")!);
  expect(container.querySelector(`img[src="/fashion-images/${productId}/${keep}?preview=1"]`)).toBeInTheDocument();
  fireEvent.click(black.getByLabelText("Remove photo 1", { selector: "button" }));
  fireEvent.click(black.getByLabelText("Remove size 2", { selector: "button" }));
  fireEvent.click(screen.getByLabelText("Remove color 2", { selector: "button" }));
  await act(async () => { fireEvent.submit(container.querySelector("form")!); });

  const submitted = action.mock.calls[0][1];
  expect(submitted.get("fashionProductId")).toBe(productId);
  expect(submitted.get("state")).toBe("draft");
  expect(submitted.getAll(`fashionKeep-${productId}`)).toEqual([keep]);
  expect(submitted.getAll(`fashionKeep-${otherColorId}`)).toEqual([]);
  expect(JSON.parse(String(submitted.get("fashionPayload"))).colors).toEqual([
    { id: productId, name: "Black", sizes: [{ size: "M", quantity: "3", price: "" }] },
  ]);
  expect(screen.queryByText("Color 2", { selector: "legend" })).toBeNull();
  expect(black.getAllByLabelText(/Remove photo \d+/, { selector: "button" })).toHaveLength(1);
});

it("prepares clothing photos as WebP and sends them for the corresponding color", async () => {
  const action = vi.fn<Action>().mockResolvedValue({ error: "invalid" });
  const { container } = render(<ListingForm action={action} copy={copy} locale="en" scope="fashion" submissionId={productId} />);
  vi.stubGlobal("createImageBitmap", vi.fn().mockResolvedValue({ width: 20, height: 20, close: vi.fn() }));
  vi.stubGlobal("URL", class extends URL {
    static createObjectURL = vi.fn(() => "blob:clothing-preview");
    static revokeObjectURL = vi.fn();
  });
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({ drawImage: vi.fn() } as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(callback => callback(new Blob(["test bytes"], { type: "image/webp" })));
  const black = within(screen.getByText("Color 1", { selector: "legend" }).closest("fieldset")!);
  await act(async () => {
    fireEvent.change(black.getByLabelText("Photos"), { target: { files: [
      new File(["front"], "front.png", { type: "image/png" }),
      new File(["back"], "back.jpg", { type: "image/jpeg" }),
    ] } });
  });
  expect(container.querySelectorAll('img[src="blob:clothing-preview"]')).toHaveLength(2);
  await act(async () => { fireEvent.submit(container.querySelector("form")!); });

  const submitted = action.mock.calls[0][1];
  const photos = submitted.getAll(`fashionPhoto-${productId}`);
  expect(photos).toHaveLength(2);
  for (const photo of photos) {
    expect(photo).toBeInstanceOf(File);
    expect(photo).toMatchObject({ name: "photo.webp", type: "image/webp" });
  }
  expect(submitted.has(`fashionKeep-${productId}`)).toBe(false);
});
