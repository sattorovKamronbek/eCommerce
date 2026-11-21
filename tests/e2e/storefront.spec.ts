import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("legacy catalog theme, images, console and accessibility", async ({
  page,
}, testInfo) => {
  // This combined check loads all imagery and audits both themes on a local laptop.
  test.setTimeout(60_000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.goto("/katalog");
  await expect(page).toHaveTitle(/VERSAX/);
  await expect(page.locator("h1")).toContainText("Katalog");
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(async () => {
    for (const img of Array.from(document.images)) {
      img.loading = "eager";
    }
    await Promise.all(
      Array.from(document.images).map((img) => img.decode().catch(() => {})),
    );
  });
  expect(
    await page.evaluate(() =>
      Array.from(document.images).every(
        (img) => img.complete && img.naturalWidth > 0,
      ),
    ),
  ).toBe(true);
  const firstProductImage = page.locator(".product-image img").first();
  await expect(firstProductImage).toBeVisible();
  expect(await firstProductImage.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
  await page.screenshot({
    path: `/tmp/oro-${testInfo.project.name}-viewport.png`,
  });
  await page.screenshot({
    path: `/tmp/oro-${testInfo.project.name}.png`,
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page
    .getByRole("button", { name: "Rang mavzusini almashtirish" })
    .click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.screenshot({
    path: `/tmp/oro-${testInfo.project.name}-dark.png`,
    fullPage: true,
  });
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(errors).toEqual([]);
});
test("search success, price filter and no results", async ({ page }) => {
  await page.goto("/katalog");
  await page.getByLabel("Mahsulot qidirish").fill("Nur");
  await page.getByRole("button", { name: "Qo‘llash" }).click();
  await expect(page.locator(".product-card")).toHaveCount(1);
  await expect(page.locator(".product-card")).toContainText("Nur");
  await page.getByLabel("Mahsulot qidirish").fill("not-a-product");
  await page.getByRole("button", { name: "Qo‘llash" }).click();
  await expect(
    page.getByRole("heading", { name: "Hech narsa topilmadi" }),
  ).toBeVisible();
  await page.goto("/katalog?narx=300000&mavjud=1");
  await expect(page.locator(".product-card")).toHaveCount(1);
});
test("product to cart, quantity persistence, remove, unavailable and wishlist", async ({
  page,
}) => {
  await page.goto("/mahsulot/sokin-keramik-vaza");
  await page.getByLabel("Miqdor").fill("2");
  await page.getByRole("button", { name: "Savatga qo‘shish" }).click();
  await expect(page.getByRole("status")).toContainText("Savatga qo‘shildi");
  await page.getByRole("button", { name: "Savat (2)", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("570");
  await page.keyboard.press("Escape");
  await page.goto("/savat");
  await expect(page.locator(".quantity span")).toHaveText("2");
  await page.getByRole("button", { name: "Miqdorni oshirish" }).click();
  await page.reload();
  await expect(page.locator(".quantity span")).toHaveText("3");
  await page.getByRole("button", { name: /Olib tashlash/ }).click();
  await expect(
    page.getByRole("heading", { name: "Savatingiz hali bo‘sh" }),
  ).toBeVisible();
  await page.goto("/mahsulot/mayin-yostiq");
  await expect(
    page.getByRole("button", { name: "Hozircha mavjud emas" }),
  ).toBeDisabled();
  await page.goto("/katalog");
  await page
    .getByRole("button", { name: "Sevimlilarga qo‘shish" })
    .first()
    .click();
  await page.goto("/sevimlilar");
  await expect(page.locator(".product-card")).toHaveCount(1);
  await page.reload();
  await expect(page.locator(".product-card")).toHaveCount(1);
});
test("the retired storefront homepage returns 404", async ({ request }) => {
  const response = await request.get("/storefront-preview", { maxRedirects: 0 });
  expect(response.status()).toBe(404);
});

test("mobile navigation and explicit checkout boundary", async ({
  page,
}, testInfo) => {
  await page.goto("/katalog");
  if (testInfo.project.name === "mobile") {
    await page.getByRole("button", { name: "Menyu", exact: true }).click();
    await page
      .getByRole("dialog")
      .getByRole("link", { name: "Katalog", exact: true })
      .click();
    await expect(page).toHaveURL(/katalog/);
    await expect(page.getByRole("dialog")).toHaveCount(0);
  }
  await page.goto("/checkout");
  await expect(
    page.getByRole("heading", { name: "Buyurtma berish tez orada." }),
  ).toBeVisible();
  await page.goto("/mahsulot/unknown");
  await expect(
    page.getByRole("heading", { name: "Sahifa topilmadi" }),
  ).toBeVisible();
});

test("catalog, detail, and cart drawer accessibility", async ({ page }) => {
  for (const url of ["/katalog", "/mahsulot/sokin-keramik-vaza"]) {
    await page.goto(url);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  }
  await page.getByRole("button", { name: "Savatga qo‘shish" }).click();
  await page.getByRole("button", { name: "Savat (1)", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Savat (1)", exact: true }),
  ).toBeFocused();
});

test("account access remains available across responsive layouts", async ({
  page,
}) => {
  await page.goto("/katalog");
  const menu = page.getByRole("button", { name: "Menyu", exact: true });
  if (await menu.isVisible()) {
    await menu.click();
    await page
      .getByRole("dialog")
      .getByRole("link", { name: "Hisob", exact: true })
      .click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  } else {
    await expect(
      page.locator("header").getByRole("link", { name: "Hisob", exact: true }),
    ).toBeVisible();
    await page
      .locator("header")
      .getByRole("link", { name: "Hisob", exact: true })
      .click();
  }
  await expect(page).toHaveURL(/\/hisob$/);
  await expect(
    page.getByRole("heading", { name: "Siz uchun ajratilgan joy." }),
  ).toBeVisible();
});
