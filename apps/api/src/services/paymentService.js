import Stripe from "stripe";
import { env } from "../config/env.js";

const stripe = env.stripeSecretKey ? new Stripe(env.stripeSecretKey) : null;

export class PaymentValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "PaymentValidationError";
  }
}

export async function createPaymentIntent(payload) {
  // Validate payload exists
  if (!payload || typeof payload !== "object") {
    throw new PaymentValidationError("Payload is required and must be an object");
  }

  // Validate amount is required and must be a positive integer
  if (payload.amount === undefined || payload.amount === null) {
    throw new PaymentValidationError("amount is required");
  }

  if (!Number.isInteger(payload.amount)) {
    throw new PaymentValidationError("amount must be an integer (smallest currency unit, e.g. cents)");
  }

  if (payload.amount <= 0) {
    throw new PaymentValidationError("amount must be a positive integer");
  }

  // Currency defaults to "usd" if not provided
  const currency = payload.currency ?? "usd";

  // Validate currency is a string
  if (typeof currency !== "string") {
    throw new PaymentValidationError("currency must be a string");
  }

  // If no stripe client is configured, throw an error
  if (!stripe) {
    throw new PaymentValidationError("Stripe is not configured. STRIPE_SECRET_KEY environment variable is required.");
  }

  try {
    // Create a real PaymentIntent using Stripe SDK
    const paymentIntent = await stripe.paymentIntents.create({
      amount: payload.amount,
      currency: currency.toLowerCase(),
      metadata: payload.metadata || {}
    });

    // Return the client_secret and paymentId from the actual Stripe response
    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: payload.amount,
      currency: currency,
      provider: "stripe"
    };
  } catch (error) {
    // Handle Stripe-specific errors and preserve their messages
    if (error.type && error.type.startsWith("Stripe")) {
      // Re-throw with original Stripe error message preserved
      const stripeError = new Error(error.message);
      stripeError.name = error.type;
      stripeError.stripeCode = error.code;
      stripeError.stripeDeclineCode = error.decline_code;
      throw stripeError;
    }
    // Re-throw any other errors
    throw error;
  }
}
