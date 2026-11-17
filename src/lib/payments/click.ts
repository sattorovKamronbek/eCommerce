import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { parseUzsTiyin } from "@/lib/sellers/listing";

// Protocol verification only: a valid signature is not proof of a settled payment.
export function parseClickNotification(params: URLSearchParams, secret: string, expectedService: string) {
  const one = (name: string) => {
    const values = params.getAll(name);
    return values.length === 1 && values[0].length <= 256 ? values[0] : null;
  };
  if (!secret || !expectedService) return null;
  const click = one("click_trans_id"), service = one("service_id"), merchant = one("merchant_trans_id");
  const amount = one("amount"), action = one("action"), time = one("sign_time"), signature = one("sign_string");
  const prepareId = action === "1" ? one("merchant_prepare_id") : null;
  if (!click || !/^\d+$/.test(click) || service !== expectedService || !merchant || !amount || !/^(0|[1-9]\d*)(\.\d{1,2})?$/.test(amount) || !time || !signature || !/^[0-9a-f]{32}$/i.test(signature) || (action !== "0" && action !== "1") || (action === "1" && (!prepareId || !/^\d+$/.test(prepareId)))) return null;
  const amountTiyin = parseUzsTiyin(amount);
  if (amountTiyin === null) return null;
  const signed = click + service + secret + merchant + (prepareId ?? "") + amount + action + time;
  const expected = createHash("md5").update(signed, "utf8").digest();
  if (!timingSafeEqual(expected, Buffer.from(signature, "hex"))) return null;
  return { action: action === "0" ? "prepare" as const : "complete" as const, clickTransactionId: click, merchantTransactionId: merchant, merchantPrepareId: prepareId, amountTiyin };
}
