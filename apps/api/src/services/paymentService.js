import Stripe from "stripe";
import { z } from "zod";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
  apiVersion: "2025-03-31.basil",
});

export const paymentIntentSchema = z.object({
  amount: z.number().int().min(50).max(99999999),
  currency: z.string().length(3).default("usd"),
  description: z.string().max(500).optional(),
  metadata: z.record(z.string()).optional(),
});

export async function createPaymentIntent(payload) {
  const parsed = paymentIntentSchema.safeParse(payload);
  if (!parsed.success) {
    const err = new Error("Validation failed");
    err.status = 400;
    err.details = parsed.error.flatten().fieldErrors;
    throw err;
  }
  try {
    const pi = await stripe.paymentIntents.create({
      amount: parsed.data.amount,
      currency: parsed.data.currency,
      description: parsed.data.description || "FreelanceFlow payment",
      metadata: parsed.data.metadata || {},
    });
    return {
      paymentId: pi.id, clientSecret: pi.client_secret,
      amount: pi.amount, currency: pi.currency,
      status: pi.status, provider: "stripe",
    };
  } catch (error) {
    const err = new Error(error.message);
    err.status = error.type === "StripeCardError" ? 402
      : error.type === "StripeInvalidRequestError" ? 400 : 500;
    throw err;
  }
}
