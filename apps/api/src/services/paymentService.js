import Stripe from "stripe";
import { z } from "zod";
import { env } from "../config/env.js";

const paymentIntentSchema = z.object({
  amount: z.number().int().positive(),
  currency: z.string().trim().min(3).max(3).default("usd")
});

export async function createPaymentIntent(payload) {
  const { amount, currency } = paymentIntentSchema.parse(payload);

  if (!env.stripeSecretKey) {
    throw new Error("STRIPE_SECRET_KEY is required to create Stripe PaymentIntents");
  }

  const stripe = new Stripe(env.stripeSecretKey);
  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: currency.toLowerCase(),
    automatic_payment_methods: { enabled: true }
  });

  return {
    id: paymentIntent.id,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    clientSecret: paymentIntent.client_secret,
    provider: "stripe"
  };
}
