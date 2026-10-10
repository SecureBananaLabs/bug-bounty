import { z } from "zod";
import { ok, fail } from "../utils/response.js";
import { createPaymentIntent } from "../services/paymentService.js";

const ALLOWED_CURRENCIES = ["usd", "eur", "gbp"];

const paymentSchema = z.object({
  amount: z.number().int().positive().max(999999),
  currency: z.enum(ALLOWED_CURRENCIES).default("usd")
});

export async function createPayment(req, res) {
  const parsed = paymentSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, "Invalid payment payload: " + parsed.error.issues.map(i => i.message).join(", "), 400);
  }
  return ok(res, await createPaymentIntent(parsed.data), 201);
}
