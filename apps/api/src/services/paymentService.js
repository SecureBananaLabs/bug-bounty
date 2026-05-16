import Stripe from "stripe";
import { env } from "../config/env.js";

let cachedStripeClient;

function getStripeClient(stripeClient) {
  if (stripeClient) {
    return stripeClient;
  }

  if (!env.stripeSecretKey) {
    throw new Error("STRIPE_SECRET_KEY is required to create payment intents");
  }

  cachedStripeClient ??= new Stripe(env.stripeSecretKey);
  return cachedStripeClient;
}

function normalizeAmount(amount) {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new TypeError("Payment amount must be a positive integer in the smallest currency unit");
  }

  return amount;
}

function normalizeCurrency(currency = "usd") {
  if (typeof currency !== "string") {
    throw new TypeError("Payment currency must be a three-letter ISO currency code");
  }

  const normalizedCurrency = currency.trim().toLowerCase();
  if (!/^[a-z]{3}$/.test(normalizedCurrency)) {
    throw new TypeError("Payment currency must be a three-letter ISO currency code");
  }

  return normalizedCurrency;
}

function normalizeMetadata(metadata) {
  if (metadata == null) {
    return undefined;
  }

  if (typeof metadata !== "object" || Array.isArray(metadata)) {
    throw new TypeError("Payment metadata must be an object when provided");
  }

  const normalizedMetadata = Object.fromEntries(
    Object.entries(metadata)
      .filter(([, value]) => value != null)
      .map(([key, value]) => [key, String(value)])
  );

  return Object.keys(normalizedMetadata).length > 0 ? normalizedMetadata : undefined;
}

function getStripeErrorMessage(error) {
  return error?.raw?.message ?? error?.message ?? "Unknown Stripe API error";
}

export async function createPaymentIntent(payload = {}, options = {}) {
  const amount = normalizeAmount(payload.amount);
  const currency = normalizeCurrency(payload.currency);
  const metadata = normalizeMetadata(payload.metadata);
  const stripe = getStripeClient(options.stripeClient);

  const params = { amount, currency };
  if (metadata) {
    params.metadata = metadata;
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create(params);

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount,
      currency,
      provider: "stripe"
    };
  } catch (error) {
    throw new Error(`Stripe payment intent creation failed: ${getStripeErrorMessage(error)}`, {
      cause: error
    });
  }
}
