import Stripe from "stripe";
import { env } from "../config/env.js";

let stripeClient;

function getStripeClient() {
  if (!stripeClient) {
    if (!env.stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY is required to create a Stripe PaymentIntent");
    }

    stripeClient = new Stripe(env.stripeSecretKey);
  }

  return stripeClient;
}

function validatePaymentIntentPayload(payload = {}) {
  const { amount, currency = "usd", metadata } = payload;

  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error("amount is required and must be a positive integer in the smallest currency unit");
  }

  if (typeof currency !== "string" || currency.trim() === "") {
    throw new Error("currency must be a non-empty string");
  }

  const request = {
    amount,
    currency: currency.toLowerCase()
  };

  if (metadata !== undefined) {
    if (metadata === null || typeof metadata !== "object" || Array.isArray(metadata)) {
      throw new Error("metadata must be an object when provided");
    }

    request.metadata = metadata;
  }

  return request;
}

function toPaymentIntentError(error) {
  const stripeMessage = error?.message || "Stripe payment intent creation failed";
  const wrapped = new Error(`Stripe payment intent creation failed: ${stripeMessage}`);
  wrapped.cause = error;
  wrapped.type = error?.type;
  return wrapped;
}

export async function createPaymentIntent(payload, client = getStripeClient()) {
  const request = validatePaymentIntentPayload(payload);

  try {
    const paymentIntent = await client.paymentIntents.create(request);

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: request.amount,
      currency: request.currency,
      provider: "stripe"
    };
  } catch (error) {
    throw toPaymentIntentError(error);
  }
}
