import Stripe from "stripe";
import { env } from "../config/env.js";

const stripe = new Stripe(env.stripeSecretKey);

export async function createPaymentIntent(payload) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(payload.amount * 100),
      currency: payload.currency ?? "usd",
    });
    return { client_secret: paymentIntent.client_secret };
  } catch (err) {
    throw new Error(`Stripe error: ${err.message}`);
  }
}
