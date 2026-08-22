import Stripe from "stripe";
import { env } from "../config/env.js";

function getDefaultStripe() {
  if (!env.stripeSecretKey) {
    throw new Error(
      "STRIPE_SECRET_KEY is required to initialize the Stripe client."
    );
  }

  return new Stripe(env.stripeSecretKey, {
    apiVersion: "2024-12-18.acacia"
  });
}

export async function createPaymentIntent(payload, { stripeClient } = {}) {
  if (
    payload == null ||
    typeof payload.amount !== "number" ||
    !Number.isInteger(payload.amount) ||
    payload.amount <= 0
  ) {
    const error = new Error(
      "Invalid payload: amount is required and must be a positive integer representing the smallest currency unit."
    );
    error.statusCode = 400;
    throw error;
  }

  const client = stripeClient || getDefaultStripe();
  const amount = payload.amount;
  const currency = (payload.currency && String(payload.currency).toLowerCase()) || "usd";

  try {
    const paymentIntent = await client.paymentIntents.create({
      amount,
      currency
    });

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret
    };
  } catch (error) {
    const message = error?.message || "PaymentIntent creation failed.";
    const enriched = new Error(message);
    enriched.statusCode = error?.statusCode || 500;
    enriched.raw = error;
    throw enriched;
  }
}
