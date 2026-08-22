import Stripe from "stripe";
import { env } from "../config/env.js";

let stripeFactory = (secretKey) => new Stripe(secretKey);

function normalizePayload(payload = {}) {
  return payload && typeof payload === "object" ? payload : {};
}

function validateAmount(amount) {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error("payload.amount is required and must be a positive integer in the smallest currency unit");
  }
}

function normalizeCurrency(currency) {
  if (currency == null || currency === "") {
    return "usd";
  }

  if (typeof currency !== "string") {
    throw new Error("payload.currency must be a string when provided");
  }

  return currency.toLowerCase();
}

function toMetadata(metadata) {
  return metadata && typeof metadata === "object" ? metadata : undefined;
}

function toError(error) {
  const message = error?.message || "Stripe request failed";
  const wrapped = new Error(message);
  wrapped.name = error?.name || "StripeError";
  return wrapped;
}

function getStripeClient() {
  if (!env.stripeSecretKey) {
    throw new Error("STRIPE_SECRET_KEY is required to create a payment intent");
  }

  return stripeFactory(env.stripeSecretKey);
}

export async function createPaymentIntent(payload) {
  const normalizedPayload = normalizePayload(payload);
  validateAmount(normalizedPayload.amount);

  const amount = normalizedPayload.amount;
  const currency = normalizeCurrency(normalizedPayload.currency);
  const metadata = toMetadata(normalizedPayload.metadata);

  const stripe = getStripeClient();

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      ...(metadata ? { metadata } : {})
    });

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount ?? amount,
      currency: paymentIntent.currency ?? currency,
      provider: "stripe"
    };
  } catch (error) {
    throw toError(error);
  }
}

export function __setStripeFactoryForTests(factory) {
  stripeFactory = factory;
}

export function __resetStripeFactoryForTests() {
  stripeFactory = (secretKey) => new Stripe(secretKey);
}
