import Stripe from "stripe";
import { env } from "../config/env.js";

let stripeClientOverride;

export class PaymentValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "PaymentValidationError";
    this.statusCode = 400;
  }
}

export class PaymentProviderError extends Error {
  constructor(message) {
    super(message);
    this.name = "PaymentProviderError";
    this.statusCode = 502;
  }
}

export async function createPaymentIntent(payload) {
  const amount = validateAmount(payload?.amount);
  const currency = validateCurrency(payload?.currency ?? "usd");
  const metadata = validateMetadata(payload?.metadata);
  const paymentIntentPayload = { amount, currency };

  if (metadata) {
    paymentIntentPayload.metadata = metadata;
  }

  try {
    const paymentIntent = await getStripeClient().paymentIntents.create(paymentIntentPayload);
    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount,
      currency,
      provider: "stripe"
    };
  } catch (error) {
    if (error?.type?.startsWith("Stripe")) {
      throw new PaymentProviderError(error.message);
    }

    throw error;
  }
}

export function setStripeClientForTest(client) {
  stripeClientOverride = client;
}

export function resetStripeClientForTest() {
  stripeClientOverride = undefined;
}

function getStripeClient() {
  if (stripeClientOverride) {
    return stripeClientOverride;
  }

  if (!env.stripeSecretKey) {
    throw new PaymentValidationError("STRIPE_SECRET_KEY is required");
  }

  return new Stripe(env.stripeSecretKey);
}

function validateAmount(amount) {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new PaymentValidationError("amount must be a positive integer in the smallest currency unit");
  }

  return amount;
}

function validateCurrency(currency) {
  if (typeof currency !== "string" || !/^[a-z]{3}$/i.test(currency)) {
    throw new PaymentValidationError("currency must be a three-letter ISO currency code");
  }

  return currency.toLowerCase();
}

function validateMetadata(metadata) {
  if (metadata === undefined) {
    return undefined;
  }

  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    throw new PaymentValidationError("metadata must be an object with string values");
  }

  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => {
      if (typeof value !== "string") {
        throw new PaymentValidationError("metadata must be an object with string values");
      }

      return [key, value];
    })
  );
}
