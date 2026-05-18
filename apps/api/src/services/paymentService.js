import Stripe from "stripe";
import { env } from "../config/env.js";

const stripe = new Stripe(env.stripeSecretKey || process.env.STRIPE_SECRET_KEY);

export async function createPaymentIntent(payload) {
  const { amount, currency = "usd", metadata = {} } = payload;

  // Validation
  if (!amount || !Number.isInteger(amount) || amount <= 0) {
    throw new Error("Invalid amount. Must be a positive integer in smallest currency unit (e.g. cents).");
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata: {
        ...metadata,
        generatedBy: "JARVIS-Strategic-Contributor"
      }
    });

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      provider: "stripe",
      status: paymentIntent.status
    };
  } catch (error) {
    // Preserve original Stripe error message
    throw new Error(`Stripe API Error: ${error.message}`);
  }
}
