import Stripe from "stripe";
import { env } from "../config/env.js";

export class PaymentServiceError extends Error {
  constructor(message, status = 500, type = "PaymentServiceError") {
    super(message);
    this.name = type;
    this.status = status;
  }
}

let stripeClient;
let stripeClientFactory = (secretKey) => new Stripe(secretKey);

function getStripeSecretKey() {
  return process.env.STRIPE_SECRET_KEY ?? env.stripeSecretKey;
}

function getStripeClient() {
  const secretKey = getStripeSecretKey();
  if (!secretKey) {
    throw new PaymentServiceError("STRIPE_SECRET_KEY is required to create payment intents", 500, "PaymentConfigurationError");
  }

  stripeClient ??= stripeClientFactory(secretKey);
  return stripeClient;
}

function normalizeAmount(amount) {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new PaymentServiceError("amount must be a positive integer in the smallest currency unit", 400, "PaymentValidationError");
  }

  return amount;
}

function normalizeCurrency(currency = "usd") {
  if (typeof currency !== "string") {
    throw new PaymentServiceError("currency must be a three-letter ISO currency code", 400, "PaymentValidationError");
  }

  const normalized = currency.trim().toLowerCase();
  if (!/^[a-z]{3}$/.test(normalized)) {
    throw new PaymentServiceError("currency must be a three-letter ISO currency code", 400, "PaymentValidationError");
  }

  return normalized;
}

function normalizeMetadata(metadata) {
  if (metadata === undefined) {
    return undefined;
  }

  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    throw new PaymentServiceError("metadata must be an object when provided", 400, "PaymentValidationError");
  }

  const entries = Object.entries(metadata)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => {
      if (!/^[A-Za-z0-9 _-]{1,40}$/.test(key)) {
        throw new PaymentServiceError("metadata keys must be 1-40 safe characters", 400, "PaymentValidationError");
      }

      if (!["string", "number", "boolean"].includes(typeof value)) {
        throw new PaymentServiceError("metadata values must be strings, numbers, or booleans", 400, "PaymentValidationError");
      }

      return [key, String(value)];
    });

  return Object.fromEntries(entries);
}

export async function createPaymentIntent(payload) {
  const amount = normalizeAmount(payload?.amount);
  const currency = normalizeCurrency(payload?.currency);
  const metadata = normalizeMetadata(payload?.metadata);
  const params = { amount, currency };

  if (metadata && Object.keys(metadata).length > 0) {
    params.metadata = metadata;
  }

  try {
    const paymentIntent = await getStripeClient().paymentIntents.create(params);
    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount ?? amount,
      currency: paymentIntent.currency ?? currency,
      provider: "stripe"
    };
  } catch (error) {
    if (error instanceof PaymentServiceError) {
      throw error;
    }

    throw new PaymentServiceError(
      error?.message ?? "Stripe payment intent creation failed",
      error?.statusCode ?? 502,
      error?.type ?? "StripePaymentError"
    );
  }
}

export function setStripeClientFactoryForTests(factory) {
  stripeClient = undefined;
  stripeClientFactory = factory;
}

export function resetPaymentServiceForTests() {
  stripeClient = undefined;
  stripeClientFactory = (secretKey) => new Stripe(secretKey);
}
