import type { MarketplaceLocale } from "@/messages/marketplace";

export function parseEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}
export function parseDisplayName(value: unknown): string | null {
  if (typeof value !== "string" || /[\u0000-\u001f\u007f]/.test(value)) return null;
  const name = value.trim();
  return name.length >= 2 && name.length <= 80 ? name : null;
}
export function validPassword(value: unknown): value is string {
  return typeof value === "string" && value.length >= 12 && value.length <= 128;
}
export function validFlowToken(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{40,128}$/i.test(value);
}
export function safeReturnPath(input: unknown, locale: MarketplaceLocale): string {
  const allowed = [`/${locale}/account`, `/${locale}/account/security`, `/${locale}/admin`, `/${locale}/admin/users`, `/${locale}/admin/sellers`, `/${locale}/admin/listings`, `/${locale}/seller/apply`, `/${locale}/seller/products`];
  return typeof input === "string" && allowed.includes(input) ? input : allowed[0];
}
export function parseAdminPage(value: string | string[] | undefined): number {
  return typeof value === "string" && /^[1-9]\d{0,4}$/.test(value) && Number(value) <= 10000 ? Number(value) : 1;
}
