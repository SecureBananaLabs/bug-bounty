import Stripe from "stripe";
import { env } from "../config/env.js";

export class PaymentServiceError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = "PaymentServiceError";
    this.statusCode = statusCode;
    this.expose = true;
  }
}

let stripeClient;

function getStripeClient() {
  if (!env.stripeSecretKey) {
    throw new PaymentServiceError("STRIPE_SECRET_KEY is required to create payment intents", 500);
  }

  stripeClient ??= new Stripe(env.stripeSecretKey);
  return stripeClient;
}

function assertPositiveInteger(value, fieldName) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new PaymentServiceError(`${fieldName} must be a positive integer in the smallest currency unit`);
  }
}

function normalizeCurrency(value) {
  const currency = value ?? "usd";
  if (typeof currency !== "string" || !/^[a-zA-Z]{3}$/.test(currency)) {
    throw new PaymentServiceError("currency must be a three-letter ISO currency code");
  }

  return currency.toLowerCase();
}

function normalizeMetadata(metadata) {
  if (metadata == null) {
    return undefined;
  }

  if (typeof metadata !== "object" || Array.isArray(metadata)) {
    throw new PaymentServiceError("metadata must be an object when provided");
  }

  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => {
      if (!key || typeof key !== "string") {
        throw new PaymentServiceError("metadata keys must be non-empty strings");
      }

      if (!["string", "number", "boolean"].includes(typeof value)) {
        throw new PaymentServiceError("metadata values must be strings, numbers, or booleans");
      }

      return [key, String(value)];
    })
  );
}

function buildPaymentIntentRequest(payload = {}) {
  assertPositiveInteger(payload.amount, "amount");

  const request = {
    amount: payload.amount,
    currency: normalizeCurrency(payload.currency)
  };

  const metadata = normalizeMetadata(payload.metadata);
  if (metadata) {
    request.metadata = metadata;
  }

  return request;
}

function normalizeStripeError(error) {
  if (error?.type?.startsWith("Stripe")) {
    return new PaymentServiceError(error.message, error.statusCode ?? 502);
  }

  return error;
}

export async function createPaymentIntent(payload, client = getStripeClient()) {
  const request = buildPaymentIntentRequest(payload);

  try {
    const paymentIntent = await client.paymentIntents.create(request);

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      provider: "stripe"
    };
  } catch (error) {
    throw normalizeStripeError(error);
  }
}
