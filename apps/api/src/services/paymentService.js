import Stripe from "stripe";
import { env as defaultEnv } from "../config/env.js";

function validateAmount(amount) {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error("amount must be a positive integer in the smallest currency unit");
  }

  return amount;
}

function normalizeCurrency(currency) {
  if (currency === undefined || currency === null || currency === "") {
    return "usd";
  }

  if (typeof currency !== "string" || !/^[a-zA-Z]{3}$/.test(currency)) {
    throw new Error("currency must be a three-letter ISO currency code");
  }

  return currency.toLowerCase();
}

function validateMetadata(metadata) {
  if (metadata === undefined) {
    return undefined;
  }

  if (metadata === null || typeof metadata !== "object" || Array.isArray(metadata)) {
    throw new Error("metadata must be an object when provided");
  }

  return metadata;
}

function createStripeClient(options) {
  if (options.stripeClient) {
    return options.stripeClient;
  }

  const stripeSecretKey = options.env?.stripeSecretKey ?? defaultEnv.stripeSecretKey;

  if (!stripeSecretKey) {
    throw new Error("STRIPE_SECRET_KEY is required to create a Stripe PaymentIntent");
  }

  const stripeFactory = options.stripeFactory ?? ((secretKey) => new Stripe(secretKey));
  return stripeFactory(stripeSecretKey);
}

export async function createPaymentIntent(payload = {}, options = {}) {
  const amount = validateAmount(payload.amount);
  const currency = normalizeCurrency(payload.currency);
  const metadata = validateMetadata(payload.metadata);
  const stripe = createStripeClient(options);

  const paymentIntentPayload = {
    amount,
    currency
  };

  if (metadata !== undefined) {
    paymentIntentPayload.metadata = metadata;
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create(paymentIntentPayload);

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount,
      currency,
      provider: "stripe"
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Stripe payment intent creation failed: ${message}`);
  }
}
