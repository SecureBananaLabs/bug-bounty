import Stripe from "stripe";
import { env } from "../config/env.js";

let stripeClient;

function getStripeClient() {
  stripeClient ??= new Stripe(env.stripeSecretKey);
  return stripeClient;
}

export function _setStripeClient(client) {
  stripeClient = client;
}

export async function createPaymentIntent(payload) {
  const { amount, currency = "usd" } = payload ?? {};

  if (amount == null) {
    const err = new Error("amount is required");
    err.status = 400;
    throw err;
  }
  if (!Number.isInteger(amount) || amount <= 0) {
    const err = new Error("amount must be a positive integer in cents");
    err.status = 400;
    throw err;
  }

  try {
    const intent = await getStripeClient().paymentIntents.create({ amount, currency });
    return {
      clientSecret: intent.client_secret,
      paymentId: intent.id,
    };
  } catch (err) {
    throw new Error(err.message);
  }
}
