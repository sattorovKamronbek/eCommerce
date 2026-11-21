import { test, expect, type Request } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { editorialDictionaries } from "../../src/messages/editorial";
import { marketplaceDictionaries } from "../../src/messages/marketplace";

function contrastRatio(foreground: string, background: string) {
  const luminance = (color: string) => {
    const channels = color.match(/[\d.]+/g)!.slice(0, 3).map(Number).map((channel) => {
      const value = channel / 255;
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  };
  const a = luminance(foreground);
  const b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

test("keyboard focus and light CS2 navigation have visible contrast", async ({ page }) => {
  await page.goto("/en/listings/cs2");
  await page.getByRole("combobox", { name: "Theme", exact: true }).selectOption("light");
  await page.reload();
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to content", exact: true });
  await expect(skip).toBeFocused();
  const skipColors = await skip.evaluate((element) => {
    const style = getComputedStyle(element);
    return { foreground: style.color, background: style.backgroundColor };
  });
  expect(contrastRatio(skipColors.foreground, skipColors.background)).toBeGreaterThanOrEqual(4.5);
  const active = page.getByRole("navigation", { name: "Main navigation", exact: true }).getByRole("link", { name: "CS2 skins", exact: true });
  const border = await active.evaluate((element) => getComputedStyle(element).borderBottomColor);
  const background = await page.locator(".mp").evaluate((element) => getComputedStyle(element).backgroundColor);
  expect(contrastRatio(border, background)).toBeGreaterThanOrEqual(3);
  await page.setViewportSize({ width: 320, height: 740 });
  await page.getByRole("link", { name: "Русский", exact: true }).click();
  const theme = page.getByRole("combobox", { name: "Тема", exact: true });
  await theme.selectOption("system");
  const textFit = await theme.evaluate((element) => {
    const select = element as HTMLSelectElement;
    const style = getComputedStyle(select);
    const context = document.createElement("canvas").getContext("2d")!;
    context.font = style.font;
    return { text: context.measureText(select.selectedOptions[0].text).width, available: select.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight) };
  });
  expect(textFit.text).toBeLessThanOrEqual(textFit.available);
});

test("category shortcuts and sample details preserve the browsing context", async ({ page }) => {
  await page.goto("/en/marketplace/cs2?q=rifle&sort=price-desc");
  await page.getByRole("navigation", { name: "Browse by type", exact: true }).getByRole("link", { name: "Rifle concepts", exact: true }).click();
  await expect(page).toHaveURL(/q=rifle.*type=rifle.*sort=price-desc/);
  await expect(page.locator(".mp-sample-card")).toHaveCount(2);
  await page.locator(".mp-sample-card").first().getByRole("link").click();
  await expect(page).toHaveURL(/night-rifle\?q=rifle.*type=rifle.*sort=price-desc/);
  await page.getByRole("link", { name: "Русский", exact: true }).click();
  await expect(page).toHaveURL(/\/ru\/marketplace\/cs2\/night-rifle\?q=rifle/);
  await page.getByRole("link", { name: "К образцам", exact: true }).click();
  await expect(page).toHaveURL(/\/ru\/marketplace\/cs2\?q=rifle.*type=rifle.*sort=price-desc/);
  await expect(page.locator(".mp-sample-card").first()).toHaveAttribute("data-sample", "night-rifle");
  await page.getByRole("navigation", { name: "Категории образцов", exact: true }).getByRole("link", { name: "Все типы", exact: true }).click();
  await expect(page).toHaveURL(/q=rifle&sort=price-desc$/);
});

test("homepage opens seller catalogs without sample listings or a demo banner", async ({ page }) => {
  await page.goto("/en/marketplace");
  await expect(page.locator(".mp-sample-card, .mp-notice")).toHaveCount(0);
  await page.getByRole("link", { name: "Explore skins", exact: true }).click();
  await expect(page).toHaveURL(/\/en\/listings\/cs2$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Seller listings");
});

test("home explains both marketplace directions and direct payment", async ({ page }) => {
  await page.goto("/uz/marketplace");
  const copy = marketplaceDictionaries.uz;
  const details = page.getByRole("region", { name: copy.buyingTitle });
  await expect(details.getByText(copy.cs2Plan)).toBeVisible();
  await expect(details.getByText(copy.fashionPlan)).toBeVisible();
  await expect(details.getByText(copy.planNote)).toBeVisible();
  await details.getByRole("link", { name: copy.how }).click();
  await expect(page).toHaveURL(/\/uz\/marketplace\/how-it-works$/);
});

test("keyboard entry and translated narrow layouts remain usable", async ({ page }) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/en/marketplace");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content", exact: true })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#marketplace-main")).toBeFocused();
  for (const locale of ["uz", "ru", "en"] as const) {
    for (const surface of ["", "/fashion"]) {
      await page.goto(`/${locale}/marketplace${surface}`);
      await expect(page.locator("h1")).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      const theme = page.getByRole("combobox", { name: marketplaceDictionaries[locale].theme, exact: true });
      const bounds = await theme.boundingBox();
      expect(bounds).not.toBeNull();
      expect(bounds!.x).toBeGreaterThanOrEqual(0);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(320);
    }
  }
});

test("marketplace entry, both destinations, languages and theme preference", async ({ page }) => {
  // This journey crosses root layouts and checks theme/cart hydration after full loads.
  test.setTimeout(60_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto("/");
  await expect(page).toHaveURL(/\/uz\/marketplace$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "uz");
  await page.getByRole("link", { name: "English", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(editorialDictionaries.en.outerwear);
  await page.getByRole("combobox", { name: "Theme", exact: true }).selectOption("dark");
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.reload();
  await expect(page.getByRole("combobox", { name: "Theme", exact: true })).toHaveValue("dark");
  expect(errors).toEqual([]);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByRole("combobox", { name: "Theme", exact: true }).selectOption("system");
  await page.emulateMedia({ colorScheme: "light" });
  await expect(page.locator("html")).toHaveClass(/light/);
  await page.getByRole("link", { name: "Explore skins", exact: true }).click();
  await expect(page.locator(".mp")).toHaveAttribute("data-world", "cs2");
  await expect(page.locator(".mp")).toHaveCSS("background-color", "rgb(20, 20, 20)");
  await page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Clothing", exact: true }).click();
  await expect(page).toHaveURL(/\/en\/listings\/fashion$/);
  await expect(page.locator("h1")).toContainText("Clothing");
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.getByRole("link", { name: "Original storefront", exact: true })).toHaveCount(0);
  await page.goto("/katalog");
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(page.locator("h1")).toContainText("Katalog");
  await page.goto("/mahsulot/sokin-keramik-vaza");
  await page.getByRole("button", { name: "Savatga qo‘shish", exact: true }).click();
  await page.goto("/en/marketplace");
  await page.goto("/savat");
  await expect(page.locator(".quantity span")).toHaveText("1");
  expect(errors).toEqual([]);
});

test("sample search, type/sort, empty state and language preserve the route and query", async ({ page }) => {
  await page.goto("/en/marketplace/cs2");
  await page.getByLabel("Type", { exact: true }).selectOption("rifle");
  await page.getByLabel("Sort", { exact: true }).selectOption("price-desc");
  await page.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(page.locator(".mp-sample-card")).toHaveCount(2);
  await expect(page.locator(".mp-sample-card").first()).toHaveAttribute("data-sample", "night-rifle");
  await page.getByRole("link", { name: "Русский", exact: true }).click();
  await expect(page).toHaveURL(/\/ru\/marketplace\/cs2\?.*type=rifle/);
  await expect(page.locator("html")).toHaveAttribute("lang", "ru");
  await page.getByLabel("Поиск", { exact: true }).fill("no-such-sample");
  await page.getByRole("button", { name: "Применить", exact: true }).click();
  await expect(page.getByText("Образцы не найдены", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Сбросить фильтры", exact: true }).last().click();
  await expect(page.locator(".mp-sample-card")).toHaveCount(3);
});

test("detail, size choice, wrong-domain rejection and trading boundary", async ({ page }) => {
  await page.goto("/en/marketplace/fashion/sand-overshirt");
  await page.getByRole("radio", { name: "L", exact: true }).check();
  await expect(page.getByRole("radio", { name: "L", exact: true })).toBeChecked();
  await expect(page.getByText("Not for sale", { exact: true })).toBeVisible();
  await expect(page.getByRole("note")).toContainText("Payment and delivery are not available");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByRole("link", { name: "Русский", exact: true }).click();
  await expect(page).toHaveURL(/\/ru\/marketplace\/fashion\/sand-overshirt$/);
  await expect(page.locator("h1")).toHaveText("Песочная рубашка");
  const response = await page.goto("/en/marketplace/cs2/sand-overshirt");
  expect(response?.status()).toBe(404);
  await expect(page.locator("h1")).toHaveText("Sample not found");
  await page.goto("/en/marketplace/how-it-works");
  await expect(page.getByText(/pay the seller directly and report the payment/)).toBeVisible();
});

for (const locale of ["uz", "ru", "en"] as const) {
  test(`${locale} home and catalogs render, load imagery and pass accessibility`, async ({ page }, testInfo) => {
    test.setTimeout(90_000);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
    const copy = marketplaceDictionaries[locale];
    for (const section of ["", "/cs2", "/fashion"]) {
      await page.goto(`/${locale}/marketplace${section}`);
      await expect(page).toHaveTitle(/VERSAX/);
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      await expect(page.locator("h1")).toContainText(section === "" ? editorialDictionaries[locale].outerwear : section === "/cs2" ? copy.cs2 : copy.fashion);
      await page.evaluate(async () => {
        for (const image of Array.from(document.images)) image.loading = "eager";
        await Promise.all(Array.from(document.images).map((image) => image.decode()));
        await document.fonts.ready;
      });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      if (!section) await page.screenshot({ path: `/tmp/marketplace-${testInfo.project.name}-${locale}.png`, fullPage: true });
    }
    expect(errors).toEqual([]);
  });
}

test("editorial entry links search and the sample cart without conflating them", async ({ page }) => {
  await page.goto("/en/marketplace");
  await expect(page.getByRole("heading", { name: "New arrivals", exact: true })).toBeVisible();
  await page.locator("header").getByRole("link", { name: "Search listings", exact: true }).click();
  await expect(page).toHaveURL(/\/en\/search$/);
  await page.getByRole("searchbox", { name: "Search listings", exact: true }).fill("winter coat");
  const documentRequests: string[] = [];
  const trackDocument = (request: Request) => {
    if (request.isNavigationRequest() && request.frame() === page.mainFrame()) documentRequests.push(request.url());
  };
  page.on("request", trackDocument);
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page).toHaveURL(/\/en\/search\?q=winter\+coat/);
  await expect(page.getByRole("region", { name: "Clothing", exact: true })).toBeVisible();
  await expect(page.getByRole("region", { name: "CS2 skins", exact: true })).toBeVisible();
  page.off("request", trackDocument);
  expect(documentRequests).toEqual([]);
  await page.getByRole("link", { name: "Русский", exact: true }).click();
  await expect(page).toHaveURL(/\/ru\/search\?q=winter\+coat/);
  await page.locator("footer").getByRole("link", { name: "Демонстрационная корзина", exact: true }).click();
  await expect(page).toHaveURL(/\/savat$/);
});

test("VERSAX branding appears in both storefront layouts", async ({ page }, testInfo) => {
  await page.goto("/en/marketplace");
  await expect(page).toHaveTitle(/VERSAX/);
  await expect(page.locator('meta[name="application-name"]')).toHaveAttribute("content", "VERSAX");
  await expect(page.getByText("The VERSAX Edit", { exact: true })).toBeVisible();
  const headerLogo = page.locator("header").getByRole("img", { name: "VERSAX", exact: true });
  await expect(headerLogo).toBeVisible();
  const smallViewport = page.viewportSize()!.width <= 660;
  await expect.poll(() => headerLogo.evaluate((img: HTMLImageElement) => new URL(img.currentSrc).pathname))
    .toBe(smallViewport ? "/images/brand/versax-compact.webp" : "/images/brand/versax.webp");
  const footerLogo = page.locator("footer").getByRole("img", { name: "VERSAX", exact: true });
  await expect(footerLogo).toBeVisible();
  for (const logo of [headerLogo, footerLogo]) {
    await logo.scrollIntoViewIfNeeded();
    const alpha = await logo.evaluate(async (img: HTMLImageElement) => {
      await img.decode();
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const context = canvas.getContext("2d")!;
      context.drawImage(img, 0, 0);
      return context.getImageData(0, 0, 1, 1).data[3];
    });
    expect(alpha).toBe(0);
  }
  const theme = page.getByRole("combobox", { name: "Theme", exact: true });
  await theme.selectOption("light");
  await expect(headerLogo).not.toHaveCSS("filter", "none");
  await expect(footerLogo).toHaveCSS("filter", "none");
  await page.screenshot({ path: testInfo.outputPath("versax-light.png") });
  await theme.selectOption("dark");
  await expect(headerLogo).toHaveCSS("filter", "none");
  await page.screenshot({ path: testInfo.outputPath("versax-dark.png") });
  await expect(page.locator('link[rel="icon"][href^="/icon.png"]').first()).toHaveCount(1);
  for (const path of ["/favicon.ico", "/icon.png"]) {
    expect((await page.request.get(path)).ok()).toBe(true);
  }
  await page.goto("/savat");
  await expect(page).toHaveTitle(/VERSAX/);
  await expect(page.locator("header").getByRole("img", { name: "VERSAX", exact: true })).toBeVisible();
  await expect(page.locator("footer").getByRole("img", { name: "VERSAX", exact: true })).toBeVisible();
});
