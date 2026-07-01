import Stripe from "stripe";
import { env } from "../config/env.js";

let stripeFactory = (secretKey) => new Stripe(secretKey);

export function setStripeFactoryForTest(factory) {
  stripeFactory = factory;
}

export function resetStripeFactoryForTest() {
  stripeFactory = (secretKey) => new Stripe(secretKey);
}

function validateAmount(amount) {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error("Payment amount is required and must be a positive integer in the smallest currency unit.");
  }
}

function normalizeCurrency(currency) {
  const normalized = (currency ?? "usd").toLowerCase();
  if (!/^[a-z]{3}$/.test(normalized)) {
    throw new Error("Payment currency must be a valid three-letter ISO currency code.");
  }
  return normalized;
}

function stripeErrorMessage(error) {
  if (error?.type && error?.message) {
    return `Stripe ${error.type}: ${error.message}`;
  }
  return error?.message ?? "Stripe payment intent creation failed.";
}

export async function createPaymentIntent(payload) {
  validateAmount(payload?.amount);
  const currency = normalizeCurrency(payload?.currency);

  if (!env.stripeSecretKey) {
    throw new Error("STRIPE_SECRET_KEY is required to create a payment intent.");
  }

  const stripe = stripeFactory(env.stripeSecretKey);

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: payload.amount,
      currency,
      metadata: payload.metadata ?? {}
    });

    if (!paymentIntent?.client_secret || !paymentIntent?.id) {
      throw new Error("Stripe returned an incomplete payment intent response.");
    }

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: payload.amount,
      currency,
      provider: "stripe"
    };
  } catch (error) {
    throw new Error(stripeErrorMessage(error));
  }
}

export async function smokeTestPaymentIntent() {
  if (process.env.RUN_STRIPE_SMOKE_TEST !== "true") {
    return { skipped: true, reason: "Set RUN_STRIPE_SMOKE_TEST=true to run Stripe smoke test." };
  }

  return {
    skipped: false,
    result: await createPaymentIntent({ amount: 100, currency: "usd", metadata: { smoke: "true" } })
  };
}
