import Stripe from "stripe";
import { env } from "../config/env.js";

let stripeClient;

export class PaymentServiceError extends Error {
  constructor(message, statusCode = 400, cause) {
    super(message, { cause });
    this.name = "PaymentServiceError";
    this.statusCode = statusCode;
  }
}

export function getStripeClient() {
  if (!env.stripeSecretKey) {
    throw new PaymentServiceError("STRIPE_SECRET_KEY is required to create a payment intent", 500);
  }

  if (!stripeClient) {
    stripeClient = new Stripe(env.stripeSecretKey);
  }

  return stripeClient;
}

export function buildPaymentIntentParams(payload = {}) {
  const amount = payload.amount;
  if (!Number.isSafeInteger(amount) || amount <= 0) {
    throw new PaymentServiceError("payload.amount must be a positive integer in the smallest currency unit");
  }

  const currency = String(payload.currency ?? "usd").trim().toLowerCase();
  if (!/^[a-z]{3}$/.test(currency)) {
    throw new PaymentServiceError("payload.currency must be a three-letter ISO currency code");
  }

  const params = { amount, currency };
  if (payload.metadata !== undefined) {
    params.metadata = normalizeMetadata(payload.metadata);
  }

  return params;
}

export async function createPaymentIntent(payload, options = {}) {
  const client = options.stripeClient ?? getStripeClient();
  const params = buildPaymentIntentParams(payload);

  try {
    const paymentIntent = await client.paymentIntents.create(params);
    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount ?? params.amount,
      currency: paymentIntent.currency ?? params.currency,
      provider: "stripe"
    };
  } catch (error) {
    const message = error?.message ?? "Stripe payment intent creation failed";
    throw new PaymentServiceError(`Stripe payment intent failed: ${message}`, 502, error);
  }
}

function normalizeMetadata(metadata) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    throw new PaymentServiceError("payload.metadata must be an object when provided");
  }

  return Object.fromEntries(
    Object.entries(metadata)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => [key, String(value)])
  );
}
