import Stripe from "stripe";
import { env } from "../config/env.js";

let testStripeClient;

export function setStripeClientForTest(stripeClient) {
  testStripeClient = stripeClient;
}

export function clearStripeClientForTest() {
  testStripeClient = undefined;
}

export async function createPaymentIntent(payload) {
  const amount = validateAmount(payload?.amount);
  const currency = normalizeCurrency(payload?.currency);
  const metadata = normalizeMetadata(payload?.metadata);
  const stripe = getStripeClient();

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      ...(metadata ? { metadata } : {})
    });

    if (!paymentIntent.id || !paymentIntent.client_secret) {
      throw createPaymentError("Stripe did not return a payment id and client secret", 502);
    }

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount,
      currency,
      provider: "stripe"
    };
  } catch (error) {
    if (error.statusCode) {
      throw error;
    }

    const message = error.message ?? "Unknown Stripe error";
    throw createPaymentError(`Stripe payment intent failed: ${message}`, error.statusCode ?? 502);
  }
}

function getStripeClient() {
  if (testStripeClient) {
    return testStripeClient;
  }

  if (!env.stripeSecretKey) {
    throw createPaymentError("STRIPE_SECRET_KEY is required to create payment intents", 500);
  }

  return new Stripe(env.stripeSecretKey);
}

function validateAmount(amount) {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw createPaymentError("Payment amount is required and must be a positive integer in the smallest currency unit", 400);
  }

  return amount;
}

function normalizeCurrency(currency = "usd") {
  if (typeof currency !== "string" || !/^[a-z]{3}$/i.test(currency)) {
    throw createPaymentError("Payment currency must be a 3-letter ISO currency code", 400);
  }

  return currency.toLowerCase();
}

function normalizeMetadata(metadata) {
  if (metadata == null) {
    return undefined;
  }

  if (typeof metadata !== "object" || Array.isArray(metadata)) {
    throw createPaymentError("Payment metadata must be an object when provided", 400);
  }

  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => {
      if (value == null || ["string", "number", "boolean"].includes(typeof value)) {
        return [key, value == null ? "" : String(value)];
      }

      throw createPaymentError("Payment metadata values must be strings, numbers, booleans, or null", 400);
    })
  );
}

function createPaymentError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}
