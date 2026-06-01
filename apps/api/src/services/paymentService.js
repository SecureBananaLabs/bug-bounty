import Stripe from "stripe";
import { env } from "../config/env.js";

let stripeClientFactory = (secretKey) => new Stripe(secretKey);

export function setStripeClientFactoryForTests(factory) {
  stripeClientFactory = factory;
}

export function resetStripeClientFactoryForTests() {
  stripeClientFactory = (secretKey) => new Stripe(secretKey);
}

function paymentError(message, statusCode = 400, cause) {
  const error = new Error(message, { cause });
  error.statusCode = statusCode;
  error.expose = true;
  return error;
}

function normalizePaymentPayload(payload = {}) {
  const amount = payload.amount;
  if (!Number.isInteger(amount) || amount <= 0) {
    throw paymentError("Payment amount must be a positive integer in the smallest currency unit.");
  }

  const currency = payload.currency ?? "usd";
  if (typeof currency !== "string" || !/^[a-z]{3}$/i.test(currency)) {
    throw paymentError("Payment currency must be a three-letter ISO currency code.");
  }

  if (payload.metadata !== undefined) {
    if (
      typeof payload.metadata !== "object" ||
      payload.metadata === null ||
      Array.isArray(payload.metadata)
    ) {
      throw paymentError("Payment metadata must be an object when provided.");
    }

    for (const [key, value] of Object.entries(payload.metadata)) {
      if (typeof key !== "string" || key.length === 0 || value == null) {
        throw paymentError("Payment metadata entries must have non-empty keys and values.");
      }
    }
  }

  return {
    amount,
    currency: currency.toLowerCase(),
    metadata: payload.metadata
      ? Object.fromEntries(
          Object.entries(payload.metadata).map(([key, value]) => [key, String(value)])
        )
      : undefined
  };
}

function getStripeClient() {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY ?? env.stripeSecretKey;
  if (!stripeSecretKey) {
    throw paymentError("STRIPE_SECRET_KEY is required to create payment intents.", 500);
  }

  return stripeClientFactory(stripeSecretKey);
}

export async function createPaymentIntent(payload) {
  const paymentPayload = normalizePaymentPayload(payload);
  const stripe = getStripeClient();

  try {
    const paymentIntent = await stripe.paymentIntents.create(paymentPayload);

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      provider: "stripe"
    };
  } catch (error) {
    if (error?.type?.startsWith?.("Stripe")) {
      throw paymentError(error.message, 502, error);
    }

    throw error;
  }
}
