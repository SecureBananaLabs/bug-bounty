import Stripe from "stripe";
import { env } from "../config/env.js";

let stripeClientFactory = (secretKey) => new Stripe(secretKey);

export function setStripeClientFactoryForTests(factory) {
  stripeClientFactory = factory;
}

export function resetStripeClientFactoryForTests() {
  stripeClientFactory = (secretKey) => new Stripe(secretKey);
}

function paymentError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normalizeCurrency(currency) {
  if (currency != null && typeof currency !== "string") {
    throw paymentError("Payment currency must be a three-letter ISO currency code.");
  }

  const normalized = (currency ?? "usd").trim().toLowerCase();
  if (!/^[a-z]{3}$/.test(normalized)) {
    throw paymentError("Payment currency must be a three-letter ISO currency code.");
  }
  return normalized;
}

function normalizeAmount(amount) {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw paymentError("Payment amount must be a positive integer in the smallest currency unit.");
  }
  return amount;
}

function normalizeMetadata(metadata) {
  if (metadata == null) {
    return undefined;
  }

  if (typeof metadata !== "object" || Array.isArray(metadata)) {
    throw paymentError("Payment metadata must be an object when provided.");
  }

  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => {
      if (value == null) {
        throw paymentError(`Payment metadata value for "${key}" cannot be null or undefined.`);
      }
      return [key, String(value)];
    })
  );
}

function getStripeClient() {
  if (!env.stripeSecretKey) {
    throw paymentError("STRIPE_SECRET_KEY is required to create payment intents.", 500);
  }
  return stripeClientFactory(env.stripeSecretKey);
}

function rethrowStripeError(error) {
  const wrapped = new Error(error?.message ?? "Stripe payment intent creation failed.");
  wrapped.statusCode = error?.statusCode ?? error?.status ?? 502;
  wrapped.code = error?.type ?? error?.code;
  wrapped.cause = error;
  throw wrapped;
}

export async function createPaymentIntent(payload = {}) {
  const amount = normalizeAmount(payload.amount);
  const currency = normalizeCurrency(payload.currency);
  const metadata = normalizeMetadata(payload.metadata);

  try {
    const stripe = getStripeClient();
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      ...(metadata ? { metadata } : {})
    });

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount ?? amount,
      currency: paymentIntent.currency ?? currency,
      provider: "stripe"
    };
  } catch (error) {
    if (error.statusCode === 400 || error.statusCode === 500) {
      throw error;
    }
    rethrowStripeError(error);
  }
}
