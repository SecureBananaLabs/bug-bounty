import Stripe from "stripe";
import { env } from "../config/env.js";

let stripe;

function getStripe() {
  if (!stripe) {
    if (!env.stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    stripe = new Stripe(env.stripeSecretKey);
  }
  return stripe;
}

export async function createPaymentIntent(payload) {
  const amount = payload?.amount;
  const currency = payload?.currency ?? "usd";
  const metadata = payload?.metadata;

  if (amount === undefined || amount === null) {
    throw new Error("amount is required");
  }

  if (typeof amount !== "number" || !Number.isInteger(amount) || amount <= 0) {
    throw new Error("amount must be a positive integer");
  }

  const stripeClient = getStripe();
  const paymentIntent = await stripeClient.paymentIntents.create({
    amount,
    currency,
    metadata,
  });

  return {
    paymentId: paymentIntent.id,
    clientSecret: paymentIntent.client_secret,
  };
}
