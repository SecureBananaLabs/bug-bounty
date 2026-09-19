import Stripe from "stripe";
import { env } from "../config/env.js";

let _stripe = null;

function getStripe() {
  if (!_stripe) {
    if (!env.stripeSecretKey) {
      throw Object.assign(
        new Error("STRIPE_SECRET_KEY environment variable is not configured"),
        { statusCode: 500 }
      );
    }
    _stripe = new Stripe(env.stripeSecretKey);
  }
  return _stripe;
}

export async function createPaymentIntent(payload) {
  // Validate amount
  if (
    payload.amount == null ||
    typeof payload.amount !== "number" ||
    !Number.isInteger(payload.amount) ||
    payload.amount <= 0
  ) {
    throw Object.assign(
      new Error(
        "amount is required and must be a positive integer (smallest currency unit, e.g. cents)"
      ),
      { statusCode: 400 }
    );
  }

  const currency = payload.currency ?? "usd";

  try {
    const stripe = getStripe();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: payload.amount,
      currency,
      ...(payload.metadata ? { metadata: payload.metadata } : {}),
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentId: paymentIntent.id,
    };
  } catch (error) {
    // Preserve the original Stripe error message
    if (error instanceof Stripe.errors.StripeError) {
      throw Object.assign(new Error(error.message), {
        statusCode: error.statusCode || 500,
        stripeType: error.type,
      });
    }
    throw error;
  }
}
