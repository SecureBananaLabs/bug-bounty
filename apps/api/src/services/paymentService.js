import Stripe from "stripe";
import { env } from "../config/env.js";

export class PaymentServiceError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = "PaymentServiceError";
    this.statusCode = statusCode;
  }
}

function validateAmount(amount) {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new PaymentServiceError("amount must be a positive integer in the smallest currency unit");
  }

  return amount;
}

function validateCurrency(currency = "usd") {
  if (typeof currency !== "string" || !/^[a-z]{3}$/i.test(currency)) {
    throw new PaymentServiceError("currency must be a three-letter ISO currency code");
  }

  return currency.toLowerCase();
}

function validateMetadata(metadata) {
  if (metadata === undefined) {
    return undefined;
  }

  if (metadata === null || Array.isArray(metadata) || typeof metadata !== "object") {
    throw new PaymentServiceError("metadata must be an object when provided");
  }

  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => {
      if (value === null || typeof value === "object" || typeof value === "undefined") {
        throw new PaymentServiceError("metadata values must be primitive values");
      }

      return [key, String(value)];
    })
  );
}

function getStripeClient(options = {}) {
  if (options.stripeClient) {
    return options.stripeClient;
  }

  if (!env.stripeSecretKey) {
    throw new PaymentServiceError("STRIPE_SECRET_KEY is required to create payment intents", 500);
  }

  return new Stripe(env.stripeSecretKey);
}

export async function createPaymentIntent(payload = {}, options = {}) {
  const amount = validateAmount(payload.amount);
  const currency = validateCurrency(payload.currency);
  const metadata = validateMetadata(payload.metadata);
  const stripeClient = getStripeClient(options);

  const createInput = { amount, currency };
  if (metadata) {
    createInput.metadata = metadata;
  }

  try {
    const paymentIntent = await stripeClient.paymentIntents.create(createInput);

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount,
      currency,
      provider: "stripe"
    };
  } catch (error) {
    throw new PaymentServiceError(error.message || "Stripe payment intent creation failed", 502);
  }
}
