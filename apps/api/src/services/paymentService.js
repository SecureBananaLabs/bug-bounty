import Stripe from "stripe";
import { env } from "../config/env.js";

let stripeClient;

export function setStripeClientForTests(client) {
  stripeClient = client;
}

export function resetStripeClientForTests() {
  stripeClient = undefined;
}

export async function createPaymentIntent(payload) {
  const paymentPayload = validatePaymentPayload(payload);
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
    const message = error instanceof Error ? error.message : "Stripe payment intent creation failed";
    throw createPaymentError(message, 502, error);
  }
}

function getStripeClient() {
  if (stripeClient) {
    return stripeClient;
  }

  if (!env.stripeSecretKey) {
    throw createPaymentError("STRIPE_SECRET_KEY is required to create a Stripe PaymentIntent", 503);
  }

  stripeClient = new Stripe(env.stripeSecretKey);
  return stripeClient;
}

function validatePaymentPayload(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw createPaymentError("Payment payload must be an object", 400);
  }

  if (!Number.isInteger(payload.amount) || payload.amount <= 0) {
    throw createPaymentError(
      "payload.amount must be a positive integer in the smallest currency unit",
      400
    );
  }

  const currency = payload.currency ?? "usd";

  if (typeof currency !== "string" || !/^[a-z]{3}$/i.test(currency)) {
    throw createPaymentError("payload.currency must be a three-letter ISO currency code", 400);
  }

  return {
    amount: payload.amount,
    currency: currency.toLowerCase(),
    metadata: normalizeMetadata(payload.metadata)
  };
}

function normalizeMetadata(metadata) {
  if (metadata === undefined) {
    return {};
  }

  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    throw createPaymentError("payload.metadata must be an object when provided", 400);
  }

  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => {
      if (value === undefined || value === null) {
        throw createPaymentError(`payload.metadata.${key} must not be null or undefined`, 400);
      }

      if (!["string", "number", "boolean"].includes(typeof value)) {
        throw createPaymentError(
          `payload.metadata.${key} must be a string, number, or boolean`,
          400
        );
      }

      return [key, String(value)];
    })
  );
}

function createPaymentError(message, statusCode, cause) {
  const error = cause ? new Error(message, { cause }) : new Error(message);
  error.statusCode = statusCode;
  return error;
}
