import Stripe from "stripe";
import { env } from "../config/env.js";

class PaymentError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = "PaymentError";
    this.status = status;
  }
}

function getStripeClient() {
  if (!env.stripeSecretKey) {
    throw new PaymentError("STRIPE_SECRET_KEY is not configured", 500);
  }
  return new Stripe(env.stripeSecretKey);
}

export async function createPaymentIntent(payload) {
  if (payload.amount == null || typeof payload.amount !== "number" || payload.amount <= 0 || !Number.isInteger(payload.amount)) {
    throw new PaymentError("amount must be a positive integer (smallest currency unit, e.g. cents)");
  }

  const currency = payload.currency ?? "usd";
  if (typeof currency !== "string" || currency.trim().length !== 3) {
    throw new PaymentError("currency must be a 3-letter ISO currency code");
  }

  const stripe = getStripeClient();

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: payload.amount,
      currency,
      metadata: payload.metadata ?? {},
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      provider: "stripe",
    };
  } catch (err) {
    if (err.type === "StripeCardError") {
      throw new PaymentError(`Stripe card error: ${err.message}`);
    } else if (err.type === "StripeInvalidRequestError") {
      throw new PaymentError(`Stripe invalid request: ${err.message}`);
    } else if (err.type === "StripeAuthenticationError") {
      throw new PaymentError("Stripe authentication failed: check your API key", 500);
    } else if (err.type === "StripeRateLimitError") {
      throw new PaymentError("Stripe rate limit exceeded", 429);
    } else {
      throw new PaymentError(`Stripe error: ${err.message}`, 502);
    }
  }
}

export { PaymentError };