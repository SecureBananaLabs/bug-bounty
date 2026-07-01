import Stripe from "stripe";
import { env } from "../config/env.js";

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

function validateAmount(amount) {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new PaymentValidationError("amount is required and must be a positive integer in the smallest currency unit");
  }
}

function normalizeCurrency(currency = "usd") {
  if (typeof currency !== "string" || !/^[a-z]{3}$/i.test(currency)) {
    throw new PaymentValidationError("currency must be a 3-letter ISO currency code");
  }

  return currency.toLowerCase();
}

function normalizeMetadata(metadata) {
  if (metadata === undefined) {
    return undefined;
  }

  if (metadata === null || Array.isArray(metadata) || typeof metadata !== "object") {
    throw new PaymentValidationError("metadata must be an object when provided");
  }

  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => [key, String(value)])
  );
}

function getStripeClient() {
  if (!env.stripeSecretKey) {
    throw new PaymentValidationError("STRIPE_SECRET_KEY is required to create payment intents");
  }

  return new Stripe(env.stripeSecretKey);
}

export async function createPaymentIntent(payload = {}, options = {}) {
  validateAmount(payload.amount);
  const currency = normalizeCurrency(payload.currency);
  const metadata = normalizeMetadata(payload.metadata);
  const stripe = options.stripeClient ?? getStripeClient();

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: payload.amount,
      currency,
      ...(metadata ? { metadata } : {})
    });

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      provider: "stripe"
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Stripe payment intent creation failed";
    throw new PaymentProviderError(message);
  }
}
