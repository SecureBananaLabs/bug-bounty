import Stripe from "stripe";
import { env } from "../config/env.js";

const stripe = new Stripe(env.stripeSecretKey || "");

/**
 * Create a Stripe PaymentIntent and return client secret + payment ID.
 *
 * @param {{ amount: number, currency?: string }} payload
 * @returns {Promise<{ clientSecret: string, paymentId: string }>}
 */
export async function createPaymentIntent(payload) {
  if (payload.amount == null || typeof payload.amount !== "number" || !Number.isInteger(payload.amount) || payload.amount <= 0) {
    throw Object.assign(new Error("amount is required and must be a positive integer"), { statusCode: 400 });
  }

  const currency = payload.currency ?? "usd";

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: payload.amount,
      currency,
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentId: paymentIntent.id,
    };
  } catch (err) {
    if (err.type && err.type.startsWith("Stripe")) {
      throw err;
    }
    throw err;
  }
}
