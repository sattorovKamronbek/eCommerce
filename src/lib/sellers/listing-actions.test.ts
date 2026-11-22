// @vitest-environment node
import { readFile } from "node:fs/promises";
import { beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const mock = vi.hoisted(() => ({
  requireSeller: vi.fn(), insert: vi.fn(), from: vi.fn(),
  upload: vi.fn(), remove: vi.fn(), rpc: vi.fn(),
  redirect: vi.fn((path: string) => { throw new Error(`REDIRECT:${path}`); }),
}));
vi.mock("next/navigation", () => ({ redirect: mock.redirect }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/sellers/access", () => ({ requireSeller: mock.requireSeller }));
import { archiveListing, createListing, updateListing } from "@/app/(marketplace)/[locale]/seller/products/actions";

const seller = "00000000-0000-4000-8000-000000000001";
function form(values: Record<string, string>) { const data = new FormData(); for (const [key, value] of Object.entries(values)) data.set(key, value); return data; }
const valid = { ecosystem: "fashion", title: "Jacket", description: "Details", category: "", variant: "", price: "10.50", quantity: "1", state: "draft", seller_id: "another-user" };
const group = "10000000-0000-4000-8000-000000000001";

function cs2Form(overrides: Record<string, string> = {}) {
  const data = form({
    ecosystem: "cs2", cs2SubmissionId: group, cs2Category: "pistol", cs2Model: "Five-SeveN",
    title: "Copper finish", description: "Details", state: "published",
    "cs2Price-FN": "250.05", "cs2Price-MW": "130.10", ...overrides,
  });
  data.append("cs2Wear", "FN");
  data.append("cs2Wear", "MW");
  return data;
}

beforeEach(() => {
  vi.clearAllMocks();
  const account = {
    user: { id: seller },
    client: { from: mock.from, rpc: mock.rpc, storage: { from: () => ({ upload: mock.upload, remove: mock.remove }) } },
  };
  mock.requireSeller.mockResolvedValue({ kind: "seller", account, scope: "both" });
  const lookup = { eq: vi.fn(), limit: vi.fn(), maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) };
  lookup.eq.mockReturnValue(lookup);
  lookup.limit.mockReturnValue(lookup);
  mock.from.mockReturnValue({ insert: mock.insert, select: () => lookup });
  mock.insert.mockResolvedValue({ error: null });
  mock.upload.mockResolvedValue({ error: null });
  mock.remove.mockResolvedValue({ error: null });
  mock.rpc.mockReturnValue({ retry: () => Promise.resolve({ data: group, error: null }) });
});

const black = "20000000-0000-4000-8000-000000000001";
const white = "20000000-0000-4000-8000-000000000002";

function fashionForm(colors = [
  { id: black, name: "Black", sizes: [{ size: "m", quantity: "3", price: "" }, { size: "L", quantity: "0", price: "11.25" }] },
  { id: white, name: "White", sizes: [{ size: "M", quantity: "1", price: "" }] },
]) {
  return form({ ...valid, category: "Polo shirts", state: "published", fashionProductId: group,
    fashionBrand: "VERSAX", fashionMaterial: "100% cotton", fashionFit: "Regular", fashionCare: "30 °C",
    fashionPayload: JSON.stringify({ colors, sizeGuide: [{ size: "M", measurements: "Chest 96, length 70" }] }),
  });
}

it("saves one authorized clothing product with shared color photos and independent stock and prices", async () => {
  const data = fashionForm();
  const photo = new File([await readFile("public/images/brand/versax.webp")], "polo.webp", { type: "image/webp" });
  data.append(`fashionPhoto-${black}`, photo);
  await expect(createListing("en", {}, data)).rejects.toThrow("REDIRECT:/en/seller/products");
  expect(mock.rpc).toHaveBeenCalledTimes(1);
  expect(mock.rpc).toHaveBeenCalledWith("marketplace_save_fashion_product", {
    p_product_id: group, p_expected_updated_at: null, p_versions: [],
    p_details: {
      title: "Jacket", description: "Details", category: "Polo shirts", brand: "VERSAX", material: "100% cotton",
      fit: "Regular", care: "30 °C", price_tiyin: 1050, state: "published",
      size_guide: [{ size: "M", measurements: "Chest 96, length 70" }],
    },
    p_colors: [
      { id: black, name: "Black", images: [expect.stringMatching(/\.webp$/)], variants: [
        { size: "M", quantity: 3, price_tiyin: null }, { size: "L", quantity: 0, price_tiyin: 1125 },
      ] },
      { id: white, name: "White", images: [], variants: [{ size: "M", quantity: 1, price_tiyin: null }] },
    ],
  });
  const [name] = mock.rpc.mock.calls[0][1].p_colors[0].images;
  expect(mock.upload).toHaveBeenCalledWith(`${black}/${name}`, photo, expect.objectContaining({ upsert: false }));
  expect(mock.insert).not.toHaveBeenCalled();
});

it("refuses duplicate clothing sizes regardless of case and whitespace", async () => {
  const data = fashionForm([{ id: black, name: "Black", sizes: [
    { size: " M ", quantity: "1", price: "" }, { size: "m", quantity: "2", price: "" },
  ] }]);
  expect(await createListing("en", {}, data)).toEqual({ error: "invalid" });
  expect(mock.rpc).not.toHaveBeenCalled();
  expect(mock.insert).not.toHaveBeenCalled();
});

it("rejects structured clothing submissions from a CS2-only seller", async () => {
  mock.requireSeller.mockResolvedValueOnce({ kind: "seller", scope: "cs2" });
  expect(await createListing("en", {}, fashionForm())).toEqual({ error: "unavailable" });
  expect(mock.rpc).not.toHaveBeenCalled();
  expect(mock.insert).not.toHaveBeenCalled();
});

it("creates listings only for the authenticated seller and computes exact money on the server", async () => {
  await expect(createListing("en", {}, form(valid))).rejects.toThrow("REDIRECT:/en/seller/products");
  expect(mock.from).toHaveBeenCalledWith("marketplace_listings");
  expect(mock.insert).toHaveBeenCalledWith({ seller_id: seller, ecosystem: "fashion", title: "Jacket", description: "Details", category: "", variant: "", price_tiyin: 1050, quantity: 1, state: "draft" });
});

it("denies legacy listing mutations when the caller lacks current catalog access", async () => {
  const updatedAt = "2026-11-21T08:00:00.124502+00:00";
  mock.requireSeller.mockResolvedValue({ kind: "denied" });
  expect(await createListing("en", {}, form(valid))).toEqual({ error: "unavailable" });
  expect(await updateListing("en", group, updatedAt, {}, form(valid))).toEqual({ error: "unavailable" });
  await expect(archiveListing("en", form({ id: group }))).rejects.toThrow("REDIRECT:/en/seller/products?error=unavailable");
  expect(mock.from).not.toHaveBeenCalled();
});

it("creates one atomic batch of authorized CS2 variants with their own exact price and photo", async () => {
  const data = cs2Form();
  const screenshot = new File([await readFile("public/images/brand/versax.webp")], "preview.webp", { type: "image/webp" });
  data.append("cs2Photo-FN", screenshot);
  await expect(createListing("en", {}, data)).rejects.toThrow("REDIRECT:/en/seller/products");
  expect(mock.insert).toHaveBeenCalledTimes(1);
  const rows = mock.insert.mock.calls[0][0];
  expect(rows).toMatchObject([
    { seller_id: seller, cs2_group_id: group, cs2_category: "pistol", cs2_model: "Five-SeveN",
      title: "Five-SeveN | Copper finish", cs2_wear: "FN", variant: "FN", price_tiyin: 25005, quantity: 1,
      cs2_images: [expect.stringMatching(/\.webp$/)], cs2_group_primary: true },
    { seller_id: seller, cs2_group_id: group, cs2_wear: "MW", price_tiyin: 13010, quantity: 1, cs2_images: [], cs2_group_primary: false },
  ]);
  expect(rows[0].id).not.toBe(rows[1].id);
  expect(mock.upload).toHaveBeenCalledWith(`${rows[0].id}/${rows[0].cs2_images[0]}`, screenshot, expect.objectContaining({ upsert: false }));
});

it("rejects an impossible model and malformed wear price before writing any variant", async () => {
  expect(await createListing("en", {}, cs2Form({ cs2Model: "AWP" }))).toEqual({ error: "invalid" });
  expect(await createListing("en", {}, cs2Form({ "cs2Price-MW": "1e2" }))).toEqual({ error: "invalid" });
  expect(mock.insert).not.toHaveBeenCalled();
  expect(mock.upload).not.toHaveBeenCalled();
});

it("refuses a WebP container that cannot be decoded", async () => {
  const data = cs2Form();
  const headerOnly = Buffer.from("524946460c000000574542505650382000000000", "hex");
  data.append("cs2Photo-MW", new File([headerOnly], "bad.webp", { type: "image/webp" }));
  expect(await createListing("en", {}, data)).toEqual({ error: "invalid" });
  expect(mock.upload).not.toHaveBeenCalled();
  expect(mock.insert).not.toHaveBeenCalled();
});

it("recovers a committed listing submission after the insert response is lost", async () => {
  const lookup = { eq: vi.fn(), limit: vi.fn(), maybeSingle: vi.fn() };
  lookup.eq.mockReturnValue(lookup);
  lookup.limit.mockReturnValue(lookup);
  lookup.maybeSingle.mockResolvedValueOnce({ data: null, error: null }).mockResolvedValueOnce({ data: { id: group }, error: null });
  mock.from.mockReturnValue({ insert: mock.insert, select: () => lookup });
  mock.insert.mockRejectedValueOnce(new Error("Connection closed after commit"));
  await expect(createListing("en", {}, cs2Form())).rejects.toThrow("REDIRECT:/en/seller/products");
  expect(mock.insert).toHaveBeenCalledTimes(1);
});

it("does not publish a CS2 batch if a photo upload fails", async () => {
  const data = cs2Form();
  data.append("cs2Photo-FN", new File([await readFile("public/images/brand/versax.webp")], "preview.webp", { type: "image/webp" }));
  mock.upload.mockResolvedValue({ error: { message: "Store unavailable" } });
  expect(await createListing("en", {}, data)).toEqual({ error: "photo" });
  expect(mock.insert).not.toHaveBeenCalled();
  expect(mock.remove).toHaveBeenCalledWith([expect.stringMatching(/\.webp$/)]);
});

it("rejects invalid item details before reaching the database", async () => {
  expect(await createListing("en", {}, form({ ...valid, price: "1e6" }))).toEqual({ error: "invalid" });
  expect(mock.from).not.toHaveBeenCalled();
});

it("rejects seller edits based on a listing fetched before an inventory change", async () => {
  const id = "10000000-0000-4000-8000-000000000001";
  const updatedAt = "2026-11-21T08:00:00.124502+00:00";
  const select = vi.fn().mockReturnValue({ maybeSingle: async () => ({ data: null, error: null }) });
  const filters = { eq: vi.fn(), select };
  filters.eq.mockReturnValue(filters);
  mock.from.mockReturnValue({ update: vi.fn().mockReturnValue(filters) });
  expect(await updateListing("en", id, updatedAt, {}, form(valid))).toEqual({ error: "changed" });
  expect(filters.eq).toHaveBeenCalledWith("updated_at", updatedAt);
  expect(mock.redirect).not.toHaveBeenCalled();
});
