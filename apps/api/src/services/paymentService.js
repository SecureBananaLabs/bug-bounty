import { env } from "../config/env.js";
import Stripe from "stripe";

export let stripe = new Stripe(env.stripeSecretKey || "dummy_key");

export function setStripeInstance(instance) {
  stripe = instance;
}

export async function createPaymentIntent(payload) {
  if (!payload || payload.amount === undefined || payload.amount === null) {
    throw new Error("Amount is required");
  }

  const amount = payload.amount;
  if (typeof amount !== "number" || !Number.isInteger(amount) || amount <= 0) {
    throw new Error("Amount must be a positive integer");
  }

  const currency = payload.currency ?? "usd";

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      provider: "stripe"
    };
  } catch (error) {
    // Stripe errors (StripeCardError, StripeInvalidRequestError, etc.) are caught and re-thrown with the original Stripe error message preserved
    throw error;
  }
}

