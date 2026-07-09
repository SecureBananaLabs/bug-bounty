import Stripe from "stripe";
import { env } from "../config/env.js";

let stripeClient;

function getStripeClient() {
  if (stripeClient) {
    return stripeClient;
  }

  if (!env.stripeSecretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }

  stripeClient = new Stripe(env.stripeSecretKey);
  return stripeClient;
}

// Testing seam: allows unit tests to inject a mocked Stripe client
// without making real network calls to the Stripe API.
export function __setStripeClientForTesting(client) {
  stripeClient = client;
}

function validateAmount(amount) {
  if (amount === undefined || amount === null) {
    throw new Error("payload.amount is required");
  }

  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error(
      "payload.amount must be a positive integer representing the smallest currency unit (e.g. cents)"
    );
  }
}

export async function createPaymentIntent(payload) {
  const { amount, currency, metadata } = payload ?? {};

  validateAmount(amount);
  const resolvedCurrency = currency ?? "usd";

  const stripe = getStripeClient();

  let paymentIntent;
  try {
    paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: resolvedCurrency,
      ...(metadata ? { metadata } : {})
    });
  } catch (error) {
    throw new Error(`Stripe payment intent creation failed: ${error.message}`);
  }

  return {
    clientSecret: paymentIntent.client_secret,
    paymentId: paymentIntent.id,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    provider: "stripe"
  };
}
