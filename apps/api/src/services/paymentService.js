import Stripe from "stripe";
import { env } from "../config/env.js";

const stripe = env.stripeSecretKey
  ? new Stripe(env.stripeSecretKey, { apiVersion: "2025-06-15.acacia" })
  : null;

export async function createPaymentIntent(payload) {
  // Validate amount is required and must be a positive integer (cents)
  if (payload.amount === undefined || payload.amount === null) {
    const err = new Error("Missing required field: amount");
    err.name = "ValidationError";
    throw err;
  }

  const amount = Number(payload.amount);
  if (!Number.isInteger(amount) || amount <= 0) {
    const err = new Error("amount must be a positive integer (smallest currency unit)");
    err.name = "ValidationError";
    throw err;
  }

  const currency = payload.currency ?? "usd";

  // If Stripe is not configured, throw an error
  if (!stripe) {
    const err = new Error("Stripe is not configured. Set STRIPE_SECRET_KEY environment variable.");
    err.name = "ConfigurationError";
    throw err;
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentId: paymentIntent.id,
    };
  } catch (error) {
    // Re-throw Stripe errors with their original messages preserved
    throw error;
  }
}
