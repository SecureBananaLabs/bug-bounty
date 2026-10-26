import Stripe from "stripe";
import { env } from "../config/env.js";

let stripeClient;

export function setStripeClient(client) {
  stripeClient = client;
}

function getStripeClient() {
  if (!stripeClient) {
    if (!env.stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY is required to create a payment intent");
    }
    stripeClient = new Stripe(env.stripeSecretKey);
  }
  return stripeClient;
}

function validatePaymentPayload(payload = {}) {
  if (!Number.isInteger(payload.amount) || payload.amount <= 0) {
    throw new Error("amount must be a positive integer in the smallest currency unit");
  }

  const currency = payload.currency ?? "usd";
  if (typeof currency !== "string" || !/^[a-z]{3}$/i.test(currency)) {
    throw new Error("currency must be a three-letter ISO currency code");
  }

  return {
    amount: payload.amount,
    currency: currency.toLowerCase(),
    ...(payload.metadata && { metadata: payload.metadata })
  };
}

export async function createPaymentIntent(payload) {
  const paymentPayload = validatePaymentPayload(payload);

  try {
    const paymentIntent = await getStripeClient().paymentIntents.create(paymentPayload);

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      provider: "stripe"
    };
  } catch (error) {
    throw new Error(error.message);
  }
}
