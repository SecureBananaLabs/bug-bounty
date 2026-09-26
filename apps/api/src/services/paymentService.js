import Stripe from "stripe";
import { env } from "../config/env.js";

let stripeClientFactory = (secretKey) => new Stripe(secretKey);

export class PaymentServiceError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = "PaymentServiceError";
    this.statusCode = statusCode;
  }
}

export function setStripeClientFactoryForTesting(factory) {
  stripeClientFactory = factory;
}

export function resetStripeClientFactoryForTesting() {
  stripeClientFactory = (secretKey) => new Stripe(secretKey);
}

export async function createPaymentIntent(payload = {}) {
  const amount = validateAmount(payload.amount);
  const currency = validateCurrency(payload.currency ?? "usd");
  const metadata = validateMetadata(payload.metadata);
  const stripeSecretKey = getStripeSecretKey();

  if (!stripeSecretKey) {
    throw new PaymentServiceError("STRIPE_SECRET_KEY is required to create payment intents", 500);
  }

  try {
    const stripe = stripeClientFactory(stripeSecretKey);
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      ...(metadata ? { metadata } : {})
    });

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount,
      currency,
      provider: "stripe"
    };
  } catch (error) {
    if (error instanceof PaymentServiceError) {
      throw error;
    }

    throw new PaymentServiceError(error.message || "Stripe payment intent creation failed", 502);
  }
}

function getStripeSecretKey() {
  return process.env.STRIPE_SECRET_KEY || env.stripeSecretKey;
}

function validateAmount(amount) {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new PaymentServiceError("Payment amount is required and must be a positive integer");
  }

  return amount;
}

function validateCurrency(currency) {
  if (typeof currency !== "string" || !/^[a-z]{3}$/i.test(currency)) {
    throw new PaymentServiceError("Payment currency must be a 3-letter ISO currency code");
  }

  return currency.toLowerCase();
}

function validateMetadata(metadata) {
  if (metadata === undefined) {
    return undefined;
  }

  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    throw new PaymentServiceError("Payment metadata must be an object when provided");
  }

  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => {
      if (typeof value !== "string") {
        throw new PaymentServiceError("Payment metadata values must be strings");
      }

      return [key, value];
    })
  );
}
