import Stripe from "stripe";
import { env } from "../config/env.js";

let stripeClient;

function createHttpError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.expose = true;
  return error;
}

function getStripeClient() {
  if (!env.stripeSecretKey) {
    throw createHttpError("STRIPE_SECRET_KEY is required to create payment intents", 500);
  }

  stripeClient ??= new Stripe(env.stripeSecretKey);
  return stripeClient;
}

function validatePayload(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw createHttpError("Payment payload must be an object", 400);
  }

  if (!Number.isInteger(payload.amount) || payload.amount <= 0) {
    throw createHttpError("amount must be a positive integer in the smallest currency unit", 400);
  }

  const currency = payload.currency ?? "usd";
  if (typeof currency !== "string" || !/^[a-z]{3}$/i.test(currency)) {
    throw createHttpError("currency must be a three-letter ISO currency code", 400);
  }

  if (
    payload.metadata !== undefined &&
    (payload.metadata === null || typeof payload.metadata !== "object" || Array.isArray(payload.metadata))
  ) {
    throw createHttpError("metadata must be an object when provided", 400);
  }

  return {
    amount: payload.amount,
    currency: currency.toLowerCase(),
    metadata: payload.metadata
  };
}

export async function createPaymentIntent(payload, options = {}) {
  const request = validatePayload(payload);
  const client = options.stripeClient ?? getStripeClient();

  try {
    const paymentIntent = await client.paymentIntents.create({
      amount: request.amount,
      currency: request.currency,
      ...(request.metadata ? { metadata: request.metadata } : {})
    });

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      provider: "stripe"
    };
  } catch (error) {
    throw createHttpError(`Stripe payment intent creation failed: ${error.message}`, 502);
  }
}
