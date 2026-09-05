import Stripe from "stripe";
import { env } from "../config/env.js";

const stripe = new Stripe(env.stripeSecretKey, {
  apiVersion: "2025-02-24.acacia"
});

if (!env.stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY is required");
}

export async function createPaymentIntent(payload) {
  const { amount, currency = "usd" } = payload;
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // cents
    currency,
    automatic_payment_methods: { enabled: true },
    metadata: { integration_check: "accept_a_payment" }
  });
  return {
    paymentId: paymentIntent.id,
    clientSecret: paymentIntent.client_secret,
    amount,
    currency,
    provider: "stripe"
  };
}
