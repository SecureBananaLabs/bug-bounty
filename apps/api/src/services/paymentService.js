import Stripe from "stripe";
import { env } from "../config/env.js";

export class PaymentServiceError extends Error {
  constructor(message, statusCode = 400, cause) {
    super(message);
    this.name = "PaymentServiceError";
    this.statusCode = statusCode;
    this.cause = cause;
  }
}

let stripeClient;

function getStripeClient() {
  if (!env.stripeSecretKey) {
    throw new PaymentServiceError("Stripe is not configured", 503);
  }

  if (!stripeClient) {
    stripeClient = new Stripe(env.stripeSecretKey);
  }

  return stripeClient;
}

function validatePayload(payload = {}) {
  if (!Number.isInteger(payload.amount) || payload.amount <= 0) {
    throw new PaymentServiceError("Payment amount must be a positive integer");
  }

  const currency = String(payload.currency ?? "usd").trim().toLowerCase();
  if (!/^[a-z]{3}$/.test(currency)) {
    throw new PaymentServiceError("Payment currency must be a three-letter ISO currency code");
  }

  if (
    payload.metadata !== undefined &&
    (payload.metadata === null || Array.isArray(payload.metadata) || typeof payload.metadata !== "object")
  ) {
    throw new PaymentServiceError("Payment metadata must be an object when provided");
  }

  return {
    amount: payload.amount,
    currency,
    metadata: payload.metadata
      ? Object.fromEntries(
          Object.entries(payload.metadata).map(([key, value]) => [key, String(value)])
        )
      : undefined
  };
}

export async function createPaymentIntent(payload, options = {}) {
  const validated = validatePayload(payload);
  const client = options.stripeClient ?? getStripeClient();

  try {
    const paymentIntent = await client.paymentIntents.create({
      amount: validated.amount,
      currency: validated.currency,
      ...(validated.metadata ? { metadata: validated.metadata } : {})
    });

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: validated.amount,
      currency: validated.currency,
      provider: "stripe"
    };
  } catch (error) {
    const message = error?.message ?? "Stripe payment intent creation failed";
    throw new PaymentServiceError(message, 502, error);
  }
}
