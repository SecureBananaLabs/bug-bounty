import Stripe from "stripe";
import { env } from "../config/env.js";

export class PaymentServiceError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = "PaymentServiceError";
    this.statusCode = statusCode;
  }
}

let stripeClient;

function getStripeClient() {
  if (!env.stripeSecretKey) {
    throw new PaymentServiceError("STRIPE_SECRET_KEY is required to create payment intents", 500);
  }

  if (!stripeClient) {
    stripeClient = new Stripe(env.stripeSecretKey);
  }

  return stripeClient;
}

export async function createPaymentIntent(payload) {
  const request = buildPaymentIntentRequest(payload);
  return createValidatedStripePaymentIntent(request, getStripeClient());
}

export async function createStripePaymentIntent(payload, client) {
  const request = buildPaymentIntentRequest(payload);
  return createValidatedStripePaymentIntent(request, client);
}

async function createValidatedStripePaymentIntent(request, client) {
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
    const message = error?.message ?? "Unknown Stripe error";
    throw new PaymentServiceError(`Stripe error: ${message}`, 502);
  }
}

function buildPaymentIntentRequest(payload = {}) {
  if (!Number.isInteger(payload.amount) || payload.amount <= 0) {
    throw new PaymentServiceError(
      "Payment amount must be a positive integer in the smallest currency unit"
    );
  }

  const currency = payload.currency ?? "usd";
  if (typeof currency !== "string" || currency.trim() === "") {
    throw new PaymentServiceError("Payment currency must be a non-empty string");
  }

  const request = {
    amount: payload.amount,
    currency: currency.toLowerCase()
  };

  if (payload.metadata !== undefined) {
    if (!isPlainObject(payload.metadata)) {
      throw new PaymentServiceError("Payment metadata must be an object when provided");
    }
    request.metadata = payload.metadata;
  }

  return request;
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
