import Stripe from "stripe";
import { createPaymentSchema } from "../validators/payment.js";

let stripe;

function getStripe() {
  if (!stripe) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-02-24.acacia"
    });
  }
  return stripe;
}

export async function createPaymentIntent(payload) {
  const parsed = createPaymentSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(parsed.error.errors[0].message);
  }

  const { amount, currency } = parsed.data;

  try {
    const paymentIntent = await getStripe().paymentIntents.create({
      amount,
      currency
    });

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret
    };
  } catch (error) {
    throw new Error(error.message);
  }
}
