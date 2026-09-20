import { ok, fail } from "../utils/response.js";
import { createPaymentIntent } from "../services/paymentService.js";

const SUPPORTED_CURRENCIES = ["usd", "eur", "gbp", "idr", "sgd", "jpy"];

export async function createPayment(req, res) {
  const { amount, currency, jobId } = req.body;

  // Validate amount: must be a positive finite number
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
    return fail(res, "amount must be a positive number", 400);
  }

  // Validate currency against supported list
  const cur = (currency ?? "usd").toLowerCase();
  if (!SUPPORTED_CURRENCIES.includes(cur)) {
    return fail(res, `unsupported currency: ${currency}. Supported: ${SUPPORTED_CURRENCIES.join(", ")}`, 400);
  }

  // Attach authenticated user to prevent BOLA/IDOR
  const payload = { amount, currency: cur, jobId, userId: req.user.sub };
  return ok(res, await createPaymentIntent(payload), 201);
}
