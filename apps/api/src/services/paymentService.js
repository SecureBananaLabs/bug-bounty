import Stripe from "stripe";
import { z } from "zod";
import { env } from "../config/env.js";

const paymentIntentSchema = z.object({
  amount: z
    .number({ required_error: "payload.amount is required" })
    .int("payload.amount must be an integer")
    .positive("payload.amount must be a positive integer"),
  currency: z.string().toLowerCase().default("usd"),
  metadata: z.record(z.string()).optional(),
});

function createStripeClient() {
  if (!env.stripeSecretKey) {
    throw new Error("STRIPE_SECRET_KEY environment variable is not set");
  }
  return new Stripe(env.stripeSecretKey, { apiVersion: "2025-04-30.basil" });
}

export async function createPaymentIntent(payload, stripeClient = createStripeClient()) {
  const parsed = paymentIntentSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0].message);
  }

  const { amount, currency, metadata } = parsed.data;
  const params = { amount, currency };
  if (metadata) params.metadata = metadata;

  try {
    const paymentIntent = await stripeClient.paymentIntents.create(params);
    return {
      clientSecret: paymentIntent.client_secret,
      paymentId: paymentIntent.id,
    };
  } catch (error) {
    throw new Error(error.message ?? String(error));
  }
}
