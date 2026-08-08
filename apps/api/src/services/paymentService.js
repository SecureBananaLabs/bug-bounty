import { z } from "zod";
import Stripe from "stripe";
import { env } from "../config/env.js";

const stripe = new Stripe(env.stripeSecretKey || "sk_test_placeholder", {
  apiVersion: "2025-06-15.acacia",
});

// ── Zod schema for input validation ──
const PaymentIntentSchema = z.object({
  amount: z.number().int().positive("amount must be a positive integer (smallest currency unit, e.g. cents)"),
  currency: z.string().regex(/^[a-z]{3}$/, "invalid ISO 4217 currency code").default("usd"),
  metadata: z.record(z.string(), z.string()).optional(),
});

/**
 * Create a Stripe PaymentIntent for the given payload.
 */
export async function createPaymentIntent(payload) {
  // ── 1. Zod validation ──
  let validated;
  try {
    validated = PaymentIntentSchema.parse(payload);
  } catch (err) {
    if (err instanceof z.ZodError) {
      const message = err.errors.map(e => `${e.path.join(".")}: ${e.message}`).join("; ");
      throw Object.assign(new Error(message), { statusCode: 400, type: "validation_error" });
    }
    throw err;
  }

  // ── 2. Build Stripe request params ──
  const params = { amount: validated.amount, currency: validated.currency };
  if (validated.metadata) params.metadata = validated.metadata;

  // ── 3. Call Stripe API ──
  try {
    const paymentIntent = await stripe.paymentIntents.create(params);
    return { clientSecret: paymentIntent.client_secret, paymentId: paymentIntent.id };
  } catch (err) {
    // ── Preserve Stripe-specific error details ──
    if (err.type && err.type.startsWith("Stripe")) {
      throw Object.assign(new Error(err.message), {
        statusCode: err.statusCode || 402,
        type: err.type,
        stripeCode: err.code,
        declineCode: err.decline_code,
      });
    }
    throw err;
  }
}
