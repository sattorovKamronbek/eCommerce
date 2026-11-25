import { parseUzsTiyin } from "@/lib/sellers/listing";

export const orderStatuses = ["reserved", "reported", "approved", "disputed", "completed", "cancelled"] as const;
export const orderActions = ["report", "report_late", "approve", "reject", "confirm", "dispute", "resume", "cancel_release", "cancel_keep"] as const;
export type OrderStatus = typeof orderStatuses[number];
export type OrderAction = typeof orderActions[number];
export type OrderRole = "buyer" | "seller" | "admin";
export type OrderEvent = OrderAction | "reserved" | "expired";

export function orderText(value: unknown, max: number, min = 1) {
  if (typeof value !== "string" || /[\u0000-\u001f\u007f]/.test(value)) return null;
  const text = value.trim();
  const length = [...text].length;
  return length >= min && length <= max ? text : null;
}

export function orderPhone(value: unknown) {
  const phone = orderText(value, 16);
  return phone && /^\+[1-9][0-9]{7,14}$/.test(phone) ? phone : null;
}

export function orderQuantity(value: unknown) {
  return typeof value === "string" && /^[1-9]\d{0,6}$/.test(value) && Number(value) <= 1000000 ? Number(value) : null;
}

export function parseDirectPayment(form: FormData) {
  const reference = orderText(form.get("reference"), 120);
  const amount = parseUzsTiyin(form.get("amount"));
  const localTime = form.get("paidAt");
  if (!reference || !amount || typeof localTime !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(localTime)) return null;
  const date = new Date(`${localTime}:00+05:00`);
  if (!Number.isFinite(date.getTime())) return null;
  const roundTrip = new Date(date.getTime() + 5 * 60 * 60 * 1000).toISOString().slice(0, 16);
  if (roundTrip !== localTime) return null;
  return { reference, amount, time: date.toISOString() };
}

export function formatTiyin(amount: number, locale: string) {
  return `${new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount / 100)} UZS`;
}

export function formatOrderDateTime(date: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Tashkent",
  }).format(new Date(date));
}
