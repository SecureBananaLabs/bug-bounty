import Stripe from "stripe";
import { env } from "../config/env.js";

const stripe = new Stripe(env.stripeSecretKey, {
  apiVersion: "2025-02-24.acacia",
});

export async function createPaymentIntent(payload) {
  const { amount, currency } = payload;

  if (!amount || amount <= 0) {
    throw new Error("Invalid payment amount. Must be a positive number.");
  }

  if (!env.stripeSecretKey) {
    throw new Error("Stripe secret key is not configured. Set STRIPE_SECRET_KEY environment variable.");
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: currency ?? "usd",
      automatic_payment_methods: { enabled: true },
      metadata: {
        integration: "freelanceflow",
      },
    });

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      provider: "stripe",
      status: paymentIntent.status,
    };
  } catch (error) {
    if (error.type === "StripeCardError") {
      throw new Error(`Card declined: ${error.message}`);
    }
    if (error.type === "StripeInvalidRequestError") {
      throw new Error(`Invalid request: ${error.message}`);
    }
    if (error.type === "StripeAuthenticationError") {
      throw new Error("Stripe authentication failed. Check STRIPE_SECRET_KEY.");
    }
    throw new Error(`Payment processing error: ${error.message}`);
  }
}