import Stripe from "stripe";
import { env } from "../config/env.js";

let stripeClient;

export class PaymentServiceError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = "PaymentServiceError";
    this.statusCode = statusCode;
  }
}

export function setStripeClientForTest(client) {
  stripeClient = client;
}

export function resetStripeClientForTest() {
  stripeClient = undefined;
}

function getStripeClient() {
  if (stripeClient) {
    return stripeClient;
  }

  if (!env.stripeSecretKey) {
    throw new PaymentServiceError("STRIPE_SECRET_KEY is required to create payment intents", 500);
  }

  stripeClient = new Stripe(env.stripeSecretKey);
  return stripeClient;
}

function validateAmount(amount) {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new PaymentServiceError("amount is required and must be a positive integer");
  }
  return amount;
}

function validateCurrency(currency) {
  const requestedCurrency = currency ?? "usd";

  if (typeof requestedCurrency !== "string") {
    throw new PaymentServiceError("currency must be a valid three-letter currency code");
  }

  const normalizedCurrency = requestedCurrency.toLowerCase();

  if (!/^[a-z]{3}$/.test(normalizedCurrency)) {
    throw new PaymentServiceError("currency must be a valid three-letter currency code");
  }

  return normalizedCurrency;
}

function validateMetadata(metadata) {
  if (metadata === undefined) {
    return undefined;
  }

  if (!metadata || Array.isArray(metadata) || typeof metadata !== "object") {
    throw new PaymentServiceError("metadata must be an object when provided");
  }

  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => {
      if (value === null || value === undefined || typeof value === "object") {
        throw new PaymentServiceError("metadata values must be strings, numbers, or booleans");
      }

      return [key, String(value)];
    })
  );
}

function toStripeError(error) {
  const type = error?.type ?? error?.raw?.type ?? "";
  if (type.startsWith("Stripe") && error?.message) {
    return new PaymentServiceError(error.message, 502);
  }

  return new PaymentServiceError("Unable to create payment intent", 502);
}

export async function createPaymentIntent(payload = {}) {
  const amount = validateAmount(payload.amount);
  const currency = validateCurrency(payload.currency);
  const metadata = validateMetadata(payload.metadata);

  try {
    const paymentIntent = await getStripeClient().paymentIntents.create({
      amount,
      currency,
      ...(metadata ? { metadata } : {})
    });

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount,
      currency,
      provider: "stripe"
    };
  } catch (error) {
    if (error instanceof PaymentServiceError) {
      throw error;
    }

    throw toStripeError(error);
  }
}
