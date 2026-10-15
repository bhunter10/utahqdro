import type { QdroRequest } from "./types";

// Prefer confirmed Stripe cents; imported Square totals are stored in dollars.
export function getRequestTotal(request: Pick<QdroRequest, "stripePaidAmountCents"> & Partial<Pick<QdroRequest, "fields">>) {
  const cents = request.stripePaidAmountCents;
  if (typeof cents === "number" && Number.isSafeInteger(cents) && cents >= 0) return cents / 100;

  const legacyTotal = request.fields?.total;
  if (typeof legacyTotal === "string" && legacyTotal.trim()) {
    const normalized = legacyTotal.replace(/[$,]/g, "").trim();
    if (/^\d+(?:\.\d{1,2})?$/.test(normalized)) {
      const amount = Number(normalized);
      if (Number.isFinite(amount)) return amount;
    }
  }
  // Before payment, Total shows the selected checkout amount, not money received.
  if (request.fields?.payment_option === "split") return 275;
  if (request.fields?.payment_option === "full") return 550;
  return 0;
}
