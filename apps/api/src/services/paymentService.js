import Stripe from "stripe";
import { env } from "../config/env.js";

let stripeClientFactory = (secretKey) => new Stripe(secretKey);

export function setStripeClientFactory(factory) {
  stripeClientFactory = factory;
}

function validateAmount(amount) {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error("Payment amount must be a positive integer in the smallest currency unit.");
  }
}

function normalizeCurrency(currency) {
  if (currency === undefined || currency === null || currency === "") return "usd";
  if (typeof currency !== "string" || !/^[a-z]{3}$/i.test(currency)) {
    throw new Error("Payment currency must be a three-letter ISO currency code.");
  }
  return currency.toLowerCase();
}

function createStripeClient() {
  if (!env.stripeSecretKey) throw new Error("STRIPE_SECRET_KEY is required to create a payment intent.");
  return stripeClientFactory(env.stripeSecretKey);
}

function normalizeStripeError(error) {
  if (error?.type?.startsWith("Stripe")) throw new Error(error.message);
  throw error;
}

export async function createPaymentIntent(payload = {}) {
  validateAmount(payload.amount);
  const currency = normalizeCurrency(payload.currency);

  try {
    const paymentIntent = await createStripeClient().paymentIntents.create({
      amount: payload.amount,
      currency,
      metadata: payload.metadata ?? {}
    });

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      provider: "stripe"
    };
  } catch (error) {
    normalizeStripeError(error);
  }
}
