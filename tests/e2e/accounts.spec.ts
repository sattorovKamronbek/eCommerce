import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("password visibility and localized confirmation retry are usable without a provider request", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/en/account/login");
  const password = page.getByLabel("Password", { exact: true });
  await password.fill("browser test password");
  await page.getByRole("button", { name: "Show password: Password", exact: true }).click();
  await expect(password).toHaveAttribute("type", "text");
  await expect(password).toHaveValue("browser test password");
  await page.getByRole("button", { name: "Hide password: Password", exact: true }).click();
  await expect(password).toHaveAttribute("type", "password");
  await page.getByRole("link", { name: "Didn't receive a confirmation email?", exact: true }).click();
  await expect(page).toHaveURL(/\/en\/account\/resend-confirmation$/);
  await expect(page.getByRole("heading", { name: "Resend confirmation", exact: true })).toBeVisible();
  await expect(page.getByLabel("Email", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Resend confirmation", exact: true })).toBeEnabled();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByRole("link", { name: "O‘zbekcha", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Tasdiqlash xatini qayta yuborish", exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test("rejected registration preserves inputs, focuses feedback and does not reload the page", async ({ page }, testInfo) => {
  await page.goto("/uz/account/register");
  await page.getByLabel("Ko‘rinadigan ism", { exact: true }).fill("Registration Check");
  await page.getByLabel("Email", { exact: true }).fill("check@example.invalid");
  await page.getByLabel("Parol", { exact: true }).fill("test password 123");
  await page.getByLabel("Parolni takrorlang", { exact: true }).fill("test password 124");
  let documentRequests = 0;
  page.on("request", request => { if (request.isNavigationRequest() && request.frame() === page.mainFrame()) documentRequests++; });
  await page.getByRole("button", { name: "Hisob yaratish", exact: true }).click();
  const feedback = page.locator('[data-slot="alert"]');
  await expect(feedback).toHaveText("Parollar bir xil emas.");
  await expect(feedback).toBeFocused();
  await expect(page.getByLabel("Ko‘rinadigan ism", { exact: true })).toHaveValue("Registration Check");
  await expect(page.getByLabel("Email", { exact: true })).toHaveValue("check@example.invalid");
  await expect(page.getByLabel("Parol", { exact: true })).toHaveValue("test password 123");
  await expect(page.getByLabel("Parolni takrorlang", { exact: true })).toHaveValue("test password 124");
  expect(documentRequests).toBe(0);
  await expect(page.getByRole("button", { name: "Hisob yaratish", exact: true })).toBeEnabled();
  await page.screenshot({ path: testInfo.outputPath("registration-error.png"), fullPage: false });
});

test("localized account forms, private-route protection and invalid email links", async ({ page }) => {
  test.setTimeout(60000);
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/en/marketplace");
  await page.locator("header").getByRole("link", { name: "Account", exact: true }).click();
  await expect(page).toHaveURL(/\/en\/account\/login/);
  await expect(page.getByRole("heading", { name: "Sign in", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "New here? Create an account" }).click();
  await expect(page.getByLabel("Display name", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Repeat password", { exact: true })).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByRole("link", { name: "Русский", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Создать аккаунт", exact: true })).toBeVisible();
  await page.goto("/uz/account/forgot-password");
  await expect(page.getByRole("heading", { name: "Parolni unutdingizmi?", exact: true })).toBeVisible();
  await page.goto("/en/admin/users");
  await expect(page).toHaveURL(/\/en\/account\/login\?next=/);
  await expect(page.getByRole("table")).toHaveCount(0);
  await page.goto("/en/auth/confirm?token_hash=bad&type=recovery");
  await expect(page).toHaveURL(/\/en\/account\/login\?notice=invalidLink$/);
  await expect(page.getByText("This link is invalid or has expired. Request a new email and try again.")).toBeVisible();
  await page.goto("/en/account/reset-password");
  await expect(page.getByRole("button", { name: "Set a new password", exact: true })).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("email confirmation GET stages a token without consuming it and removes it from the URL", async ({ page, context }) => {
  await page.goto(`/en/auth/confirm?type=signup&token_hash=${"a".repeat(64)}`);
  await expect(page).toHaveURL(/\/en\/account\/confirm-email$/);
  await expect(page.getByRole("button", { name: "Confirm your email", exact: true })).toBeVisible();
  const flow = (await context.cookies()).find(cookie => cookie.name === "mp-email-flow-en");
  expect(flow?.httpOnly).toBe(true);
  expect(flow?.path).toBe("/en/account");
  await expect(page.locator("body")).not.toContainText("a".repeat(64));
  const response = await page.request.get("/en/account/login");
  expect(response.headers()["cache-control"]).toContain("no-store");
  expect(response.headers()["referrer-policy"]).toBe("no-referrer");
});
