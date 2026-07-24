import Stripe from "stripe";
import { env } from "../config/env.js";

const stripe = env.stripeSecretKey
  ? new Stripe(env.stripeSecretKey, { apiVersion: "2025-02-24" })
  : null;

/**
 * Create a Stripe PaymentIntent.
 * @param {Object} payload
 * @param {number} payload.amount - Amount in smallest currency unit (e.g. cents). Required, must be positive integer.
 * @param {string} [payload.currency="usd"] - ISO 4217 currency code.
 * @returns {Promise<{paymentId: string, clientSecret: string, amount: number, currency: string}>}
 */
export async function createPaymentIntent(payload) {
  const amount = Number(payload.amount);

  if (!Number.isInteger(amount) || amount <= 0) {
    throw Object.assign(new Error("amount is required and must be a positive integer (in smallest currency unit, e.g. cents)"), {
      statusCode: 400,
      code: "INVALID_AMOUNT",
    });
  }

  if (!stripe) {
    throw Object.assign(new Error("STRIPE_SECRET_KEY is not configured"), {
      statusCode: 500,
      code: "STRIPE_NOT_CONFIGURED",
    });
  }

  const currency = (payload.currency || "usd").toLowerCase();

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata: payload.metadata ?? {},
    });

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    };
  } catch (err) {
    // Preserve Stripe error messages
    const message = err.type
      ? `[Stripe ${err.type}] ${err.message}`
      : err.message || "Payment processing failed";

    const error = new Error(message);
    error.statusCode = err.statusCode || 500;
    error.stripeCode = err.code;
    error.stripeType = err.type;
    throw error;
  }
}
