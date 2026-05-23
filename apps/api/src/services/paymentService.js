import Stripe from "stripe";
import { env } from "../config/env.js";

const STRIPE_API_VERSION = "2026-02-25.clover";

let cachedStripeClient;

export class PaymentServiceError extends Error {
  constructor(message, statusCode = 400, details = {}) {
    super(message);
    this.name = "PaymentServiceError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

function validateAmount(amount) {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new PaymentServiceError(
      "Payment amount is required and must be a positive integer in the smallest currency unit."
    );
  }

  return amount;
}

function normalizeCurrency(currency = "usd") {
  if (typeof currency !== "string") {
    throw new PaymentServiceError("Payment currency must be a three-letter ISO currency code.");
  }

  const normalized = currency.trim().toLowerCase();
  if (!/^[a-z]{3}$/.test(normalized)) {
    throw new PaymentServiceError("Payment currency must be a three-letter ISO currency code.");
  }

  return normalized;
}

function normalizeMetadata(metadata) {
  if (metadata === undefined) {
    return undefined;
  }

  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    throw new PaymentServiceError("Payment metadata must be an object when provided.");
  }

  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => {
      if (typeof key !== "string" || !key.trim()) {
        throw new PaymentServiceError("Payment metadata keys must be non-empty strings.");
      }

      if (value === null || typeof value === "object" || typeof value === "undefined") {
        throw new PaymentServiceError("Payment metadata values must be strings, numbers, or booleans.");
      }

      return [key, String(value)];
    })
  );
}

function getStripeClient() {
  if (cachedStripeClient) {
    return cachedStripeClient;
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY ?? env.stripeSecretKey;
  if (!stripeSecretKey) {
    throw new PaymentServiceError("STRIPE_SECRET_KEY is required to create payment intents.", 500);
  }

  cachedStripeClient = new Stripe(stripeSecretKey, {
    apiVersion: STRIPE_API_VERSION
  });

  return cachedStripeClient;
}

function mapStripeError(error) {
  if (error?.type?.startsWith?.("Stripe")) {
    return new PaymentServiceError(error.message, 502, {
      provider: "stripe",
      stripeType: error.type,
      stripeCode: error.code
    });
  }

  return error;
}

export async function createPaymentIntent(payload = {}, options = {}) {
  const amount = validateAmount(payload.amount);
  const currency = normalizeCurrency(payload.currency);
  const metadata = normalizeMetadata(payload.metadata);
  const stripeClient = options.stripeClient ?? getStripeClient();

  const createParams = {
    amount,
    currency
  };

  if (metadata) {
    createParams.metadata = metadata;
  }

  try {
    const paymentIntent = await stripeClient.paymentIntents.create(createParams);

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      provider: "stripe"
    };
  } catch (error) {
    throw mapStripeError(error);
  }
}
