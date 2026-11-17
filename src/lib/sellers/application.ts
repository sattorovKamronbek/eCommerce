export type SellerApplicationInput = {
  applicant_type: "individual" | "company";
  name: string;
  contact: string;
  region: string;
  requested_scope: "cs2" | "fashion" | "both";
  registration_details: string | null;
};
export type SellerChallengeState = { code?: string; error?: "unavailable" };
export type SellerFormState = { error?: "invalid" | "unavailable" };

function requiredText(value: FormDataEntryValue | null, max: number): string | null {
  if (typeof value !== "string" || /[\u0000-\u001f\u007f]/.test(value)) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 && [...trimmed].length <= max ? trimmed : null;
}

export function parseSellerApplication(form: FormData): SellerApplicationInput | null {
  const type = form.get("type");
  const scope = form.get("scope");
  if ((type !== "individual" && type !== "company") || (scope !== "cs2" && scope !== "fashion" && scope !== "both")) return null;
  const name = requiredText(form.get("name"), 120);
  const contact = requiredText(form.get("contact"), 200);
  const region = requiredText(form.get("region"), 120);
  const registration = form.get("registration");
  const details = typeof registration === "string" && registration.trim() ? requiredText(registration, 200) : null;
  if (!name || !contact || !region || (type === "company" && !details) || (registration && typeof registration !== "string")) return null;
  if (typeof registration === "string" && registration.trim() && !details) return null;
  return { applicant_type: type, name, contact, region, requested_scope: scope, registration_details: details };
}
