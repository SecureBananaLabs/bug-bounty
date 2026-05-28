import { z } from "zod";

const paymentIntentSchema = z.object({
  amount: z.number().min(0.50, "Amount must be at least $0.50").max(99999.00, "Amount exceeds maximum"),
  currency: z.enum(["usd", "eur", "gbp", "jpy", "cny"]).default("usd")
});

export async function createPaymentIntent(payload) {
  const validated = paymentIntentSchema.parse(payload);
  return {
    paymentId: `pay_${Date.now()}`,
    amount: validated.amount,
    currency: validated.currency,
    provider: "stripe"
  };
}
