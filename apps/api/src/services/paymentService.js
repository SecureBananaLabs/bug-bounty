import Stripe from "stripe";
import { env } from "../config/env.js";

const stripe = new Stripe(env.stripeSecretKey);

export async function createPaymentIntent(payload) {
  // Validate amount: must be a positive integer (smallest currency unit, e.g. cents)
  if (payload.amount == null || !Number.isInteger(payload.amount) || payload.amount <= 0) {
    const err = new Error(
      "Invalid amount: must be a positive integer in the smallest currency unit (e.g. cents)"
    );
    err.status = 400;
    throw err;
  }

  const currency = payload.currency ?? "usd";

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: payload.amount,
      currency
    });

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      provider: "stripe"
    };
  } catch (error) {
    // Re-throw Stripe-specific errors with their original message
    if (
      error.type === "StripeCardError" ||
      error.type === "StripeInvalidRequestError" ||
      error.type === "StripeAPIError" ||
      error.type === "StripeConnectionError" ||
      error.type === "StripeAuthenticationError" ||
      error.type === "StripeRateLimitError" ||
      error.type === "StripePermissionError"
    ) {
      throw error;
    }
    // Wrap unexpected errors
    const wrapped = new Error(error.message || "Payment processing failed");
    wrapped.status = 500;
    throw wrapped;
  }
}
