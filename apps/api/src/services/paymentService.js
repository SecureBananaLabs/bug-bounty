import Stripe from "stripe";
import { env } from "../config/env.js";

let stripeClient;
let stripeClientFactory = (secretKey) => new Stripe(secretKey);

export function setStripeClientFactoryForTests(factory) {
  stripeClientFactory = factory;
  stripeClient = undefined;
}

export function resetStripeClientFactoryForTests() {
  stripeClientFactory = (secretKey) => new Stripe(secretKey);
  stripeClient = undefined;
}

export async function createPaymentIntent(payload = {}) {
  const amount = validateAmount(payload.amount);
  const currency = validateCurrency(payload.currency ?? "usd");
  const metadata = validateMetadata(payload.metadata);

  try {
    const paymentIntent = await getStripeClient().paymentIntents.create({
      amount,
      currency,
      ...(Object.keys(metadata).length > 0 ? { metadata } : {})
    });

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount,
      currency,
      provider: "stripe"
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Stripe error";
    throw new Error(`Stripe payment intent creation failed: ${message}`);
  }
}

function getStripeClient() {
  if (stripeClient) {
    return stripeClient;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY ?? env.stripeSecretKey;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is required to create payment intents");
  }

  stripeClient = stripeClientFactory(secretKey);
  return stripeClient;
}

function validateAmount(amount) {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error("Payment amount is required and must be a positive integer in the smallest currency unit");
  }

  return amount;
}

function validateCurrency(currency) {
  if (typeof currency !== "string" || !/^[a-z]{3}$/i.test(currency)) {
    throw new Error("Payment currency must be a three-letter ISO currency code");
  }

  return currency.toLowerCase();
}

function validateMetadata(metadata) {
  if (metadata === undefined) {
    return {};
  }

  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    throw new Error("Payment metadata must be an object when provided");
  }

  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => [key, String(value)])
  );
}
