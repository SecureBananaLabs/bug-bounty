import Stripe from "stripe";
import { env } from "../config/env.js";

let stripe;

function getStripe() {
  if (!stripe) {
    stripe = new Stripe(env.stripeSecretKey);
  }
  return stripe;
}

export async function createPaymentIntent(payload) {
  // Validate required fields
  if (!payload || !payload.amount) {
    throw Object.assign(new Error("Missing required field: amount (positive integer in smallest currency unit, e.g. cents)"), { statusCode: 400 });
  }
  if (!Number.isInteger(payload.amount) || payload.amount <= 0) {
    throw Object.assign(new Error("amount must be a positive integer (smallest currency unit, e.g. cents)"), { statusCode: 400 });
  }

  const currency = (payload.currency ?? "usd").toLowerCase();

  if (!env.stripeSecretKey) {
    throw Object.assign(new Error("STRIPE_SECRET_KEY is not configured"), { statusCode: 500 });
  }

  try {
    const paymentIntent = await getStripe().paymentIntents.create({
      amount: payload.amount,
      currency,
      // Optional metadata can be passed from payload for idempotency / tracking
      metadata: payload.metadata ?? {},
    });

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      provider: "stripe",
    };
  } catch (error) {
    // Preserve Stripe error messages for known error types
    if (error.type && error.type.startsWith("Stripe")) {
      throw Object.assign(
        new Error(`Stripe error: ${error.message}`),
        { statusCode: error.statusCode ?? 500, stripeError: error.type }
      );
    }
    throw error;
  }
}
