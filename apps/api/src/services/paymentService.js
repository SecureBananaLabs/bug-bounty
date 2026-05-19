import Stripe from "stripe";
import { z } from "zod";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
  apiVersion: "2025-03-31.basil",
});

export const paymentIntentSchema = z.object({
  amount: z.number().int().min(50, "Amount must be at least 50 cents (0.50 USD)").max(99999999),
  currency: z.string().length(3).default("usd"),
  description: z.string().max(500).optional(),
  metadata: z.record(z.string()).optional(),
});

export async function createPaymentIntent(payload) {
  // Validate input
  const parsed = paymentIntentSchema.safeParse(payload);
  if (!parsed.success) {
    const err = new Error("Validation failed");
    err.status = 400;
    err.details = parsed.error.flatten().fieldErrors;
    throw err;
  }

  const { amount, currency, description, metadata } = parsed.data;

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      description: description || "FreelanceFlow payment",
      metadata: metadata || {},
    });

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      provider: "stripe",
    };
  } catch (error) {
    // Surface Stripe errors with meaningful messages
    const err = new Error(error.message || "Stripe payment failed");
    err.status = error.statusCode || 500;
    err.type = error.type || "stripe_error";

    if (error.type === "StripeCardError") {
      err.status = 402;
      err.message = `Payment declined: ${error.message}`;
    } else if (error.type === "StripeInvalidRequestError") {
      err.status = 400;
      err.message = `Invalid payment request: ${error.message}`;
    } else if (error.type === "StripeAuthenticationError") {
      err.status = 500;
      err.message = "Payment service configuration error";
    }

    throw err;
  }
}

export async function retrievePaymentIntent(paymentIntentId) {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return {
      paymentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      provider: "stripe",
    };
  } catch (error) {
    const err = new Error(`Failed to retrieve payment: ${error.message}`);
    err.status = error.statusCode || 500;
    throw err;
  }
}
