import { describe, expect, it } from "vitest";
import { parseSellerApplication } from "./application";

function form(values: Record<string, string>) {
  const result = new FormData();
  for (const [key, value] of Object.entries(values)) result.set(key, value);
  return result;
}

const individual = { type: "individual", name: "  Ali  ", contact: "ali@example.test", region: "Tashkent", scope: "cs2" };

describe("seller application input", () => {
  it("normalizes a valid individual application", () => {
    expect(parseSellerApplication(form(individual))).toEqual({ applicant_type: "individual", name: "Ali", contact: "ali@example.test", region: "Tashkent", requested_scope: "cs2", registration_details: null });
  });
  it("requires company registration details", () => {
    expect(parseSellerApplication(form({ ...individual, type: "company" }))).toBeNull();
    expect(parseSellerApplication(form({ ...individual, type: "company", registration: " 12345 " }))?.registration_details).toBe("12345");
  });
  it("rejects unsupported scopes, empty contact, control characters and overlong fields", () => {
    for (const values of [
      { ...individual, scope: "all" }, { ...individual, contact: "  " },
      { ...individual, name: "Ali\nBob" }, { ...individual, region: "x".repeat(121) },
    ]) expect(parseSellerApplication(form(values))).toBeNull();
  });
});
