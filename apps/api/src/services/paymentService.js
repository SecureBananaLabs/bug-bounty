import Stripe from "stripe";
import { env } from "../config/env.js";

export function createStripeClient(secretKey) {
  if (!secretKey) throw new Error("STRIPE_SECRET_KEY is not configured");
  return new Stripe(secretKey);
}

export async function createPaymentIntent(payload, stripeClient) {
  const { amount, currency } = payload ?? {};

  if (amount == null || !Number.isInteger(amount) || amount <= 0) {
    throw Object.assign(new Error("amount is required and must be a positive integer (in cents)"), { statusCode: 400 });
  }

  const cur = (currency ?? "usd").toLowerCase();

  const client = stripeClient ?? createStripeClient(env.stripeSecretKey);
  try {
    const pi = await client.paymentIntents.create({ amount, currency: cur });
    return {
      paymentId: pi.id,
      clientSecret: pi.client_secret,
      amount,
      currency: cur,
      provider: "stripe",
    };
  } catch (err) {
    if (err.type?.startsWith("Stripe")) {
      throw Object.assign(new Error(err.message), { statusCode: 400 });
    }
    throw err;
  }
}
