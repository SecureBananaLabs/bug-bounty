import Stripe from "stripe";
import { env } from "../config/env.js";

let stripe;

export async function createPaymentIntent(payload, client = getStripeClient()) {
  const currency = String(payload.currency ?? "usd").toLowerCase();
  const amount = toStripeAmount(payload.amount, currency);

  try {
    const intent = await client.paymentIntents.create({
      amount,
      currency,
      automatic_payment_methods: { enabled: true },
      description: payload.description,
      metadata: compactMetadata({
        jobId: payload.jobId,
        proposalId: payload.proposalId,
        userId: payload.userId
      })
    });

    return {
      paymentId: intent.id,
      clientSecret: intent.client_secret,
      amount,
      currency,
      provider: "stripe",
      status: intent.status
    };
  } catch (error) {
    const providerMessage = error?.message ?? "Stripe payment intent failed";
    throw new PaymentProviderError(providerMessage);
  }
}

export function getStripeClient() {
  if (!env.stripeSecretKey) {
    throw new PaymentProviderError("STRIPE_SECRET_KEY is not configured");
  }

  stripe ??= new Stripe(env.stripeSecretKey, {
    apiVersion: "2024-06-20"
  });
  return stripe;
}

export function toStripeAmount(amount, currency = "usd") {
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) {
    throw new PaymentProviderError("Payment amount must be greater than zero");
  }

  const zeroDecimalCurrencies = new Set([
    "bif",
    "clp",
    "djf",
    "gnf",
    "jpy",
    "kmf",
    "krw",
    "mga",
    "pyg",
    "rwf",
    "ugx",
    "vnd",
    "vuv",
    "xaf",
    "xof",
    "xpf"
  ]);
  const multiplier = zeroDecimalCurrencies.has(currency.toLowerCase()) ? 1 : 100;
  return Math.round(value * multiplier);
}

function compactMetadata(values) {
  return Object.fromEntries(
    Object.entries(values)
      .filter(([, value]) => value !== undefined && value !== null && value !== "")
      .map(([key, value]) => [key, String(value)])
  );
}

export class PaymentProviderError extends Error {
  constructor(message) {
    super(message);
    this.name = "PaymentProviderError";
    this.statusCode = 502;
  }
}
