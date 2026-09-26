import Stripe from "stripe";
import { env } from "../config/env.js";

function createStripeClient() {
  return new Stripe(env.stripeSecretKey);
}

export async function createPaymentIntent(payload, stripeClient = createStripeClient()) {
  const amount = payload?.amount;
  const currency = payload?.currency ?? "usd";

  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error("payload.amount must be a positive integer");
  }

  try {
    const paymentIntent = await stripeClient.paymentIntents.create({
      amount,
      currency
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentId: paymentIntent.id
    };
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : String(error));
  }
}
