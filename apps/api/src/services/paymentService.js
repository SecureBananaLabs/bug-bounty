import { z } from "zod";

const paymentSchema = z.object({
  amount: z.number().positive("amount must be positive"),
  currency: z.string().length(3).optional().default("usd"),
});

export async function createPaymentIntent(payload) {
  const validated = paymentSchema.parse(payload);
  // TODO: integrate Stripe SDK and return client secret.
  return {
    paymentId: `pay_${Date.now()}`,
    amount: validated.amount,
    currency: validated.currency,
    provider: "stripe"
  };
}