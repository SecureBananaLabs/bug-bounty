import Stripe from "stripe";
import { env } from "../config/env.js";

function getStripe() {
  if (!env.stripeSecretKey) {
    throw new Error("STRIPE_SECRET_KEY environment variable is not set");
  }
  return new Stripe(env.stripeSecretKey, { apiVersion: "2024-06-20" });
}

export async function createPaymentIntent(payload) {
  const { amount, currency = "usd" } = payload;

  if (amount === undefined || amount === null) {
    throw new Error("amount is required");
  }
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error("amount must be a positive integer (smallest currency unit, e.g. cents)");
  }

  const stripe = getStripe();

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: currency.toLowerCase()
    });

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      currency: paymentIntent.currency,
      amount: paymentIntent.amount,
      provider: "stripe"
    };
  } catch (err) {
    // Preserve Stripe error messages for caller
    throw new Error(err.message ?? "Stripe payment intent creation failed");
  }
}
