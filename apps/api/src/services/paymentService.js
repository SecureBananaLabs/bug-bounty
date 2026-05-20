import Stripe from "stripe";
import { env } from "../config/env.js";

function validateAmount(payload) {
  if (!Number.isInteger(payload?.amount) || payload.amount <= 0) {
    throw new Error("payload.amount must be a positive integer");
  }
}

function normalizeCurrency(payload) {
  return payload?.currency ?? "usd";
}

function getStripeClient() {
  if (!env.stripeSecretKey) {
    throw new Error("STRIPE_SECRET_KEY is required");
  }

  return new Stripe(env.stripeSecretKey);
}

export async function createPaymentIntent(payload, stripeClient = getStripeClient()) {
  validateAmount(payload);

  const currency = normalizeCurrency(payload);
  let paymentIntent;

  try {
    paymentIntent = await stripeClient.paymentIntents.create({
      amount: payload.amount,
      currency
    });
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Stripe API error");
  }

  return {
    paymentId: paymentIntent.id,
    clientSecret: paymentIntent.client_secret,
    amount: payload.amount,
    currency,
    provider: "stripe"
  };
}
