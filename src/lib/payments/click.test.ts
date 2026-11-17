// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { parseClickNotification } from "./click";

const prepare = {
  click_trans_id: "9876543210123456789", service_id: "1234", merchant_trans_id: "order-5",
  amount: "10.50", action: "0", sign_time: "2026-11-18 12:00:00", sign_string: "a96a2f09618fb789779eb92a2088359c",
};
const complete = { ...prepare, action: "1", merchant_prepare_id: "742", sign_string: "4a8ebdb2a5a057f1749bf537231a56e6" };

describe("Click Shop notification verification", () => {
  it("verifies documented Prepare and Complete signatures without losing large transaction IDs", () => {
    expect(parseClickNotification(new URLSearchParams(prepare), "fixture-secret", "1234")).toMatchObject({ action: "prepare", clickTransactionId: "9876543210123456789", amountTiyin: 1050, merchantTransactionId: "order-5" });
    expect(parseClickNotification(new URLSearchParams(complete), "fixture-secret", "1234")).toMatchObject({ action: "complete", merchantPrepareId: "742", amountTiyin: 1050 });
  });
  it("rejects changed amounts, wrong services, duplicate signed fields and invalid amounts", () => {
    expect(parseClickNotification(new URLSearchParams({ ...prepare, amount: "10.51" }), "fixture-secret", "1234")).toBeNull();
    expect(parseClickNotification(new URLSearchParams(prepare), "fixture-secret", "9999")).toBeNull();
    const duplicate = new URLSearchParams(prepare); duplicate.append("amount", "999");
    expect(parseClickNotification(duplicate, "fixture-secret", "1234")).toBeNull();
    expect(parseClickNotification(new URLSearchParams({ ...prepare, amount: "1e3" }), "fixture-secret", "1234")).toBeNull();
    expect(parseClickNotification(new URLSearchParams({ ...complete, merchant_prepare_id: "" }), "fixture-secret", "1234")).toBeNull();
  });
});
