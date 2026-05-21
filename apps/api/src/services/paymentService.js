import Stripe from "stripe";
import { env } from "../config/env.js";

let stripeClient;

export class PaymentError extends Error {
  constructor(message, { code = "payment_error", statusCode = 400, cause } = {}) {
    super(message, { cause });
    this.name = "PaymentError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

export async function createPaymentIntent(payload, options = {}) {
  const params = buildPaymentIntentParams(payload);
  const stripe = options.stripe ?? getStripeClient();

  try {
    const paymentIntent = await stripe.paymentIntents.create(params);

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: params.amount,
      currency: params.currency,
      provider: "stripe"
    };
  } catch (error) {
    throw normalizeStripeError(error);
  }
}

export function getStripeClient() {
  if (!env.stripeSecretKey) {
    throw new PaymentError("STRIPE_SECRET_KEY is required to create payment intents.", {
      code: "stripe_not_configured",
      statusCode: 500
    });
  }

  stripeClient ??= new Stripe(env.stripeSecretKey);
  return stripeClient;
}

export function buildPaymentIntentParams(payload = {}) {
  const amount = payload.amount;
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new PaymentError("Payment amount must be a positive integer in the smallest currency unit.", {
      code: "invalid_amount"
    });
  }

  const currency = normalizeCurrency(payload.currency);
  const metadata = normalizeMetadata(payload.metadata);

  return {
    amount,
    currency,
    ...(metadata ? { metadata } : {})
  };
}

function normalizeCurrency(currency = "usd") {
  if (typeof currency !== "string") {
    throw new PaymentError("Payment currency must be a three-letter currency code.", {
      code: "invalid_currency"
    });
  }

  const normalized = currency.trim().toLowerCase();
  if (!/^[a-z]{3}$/.test(normalized)) {
    throw new PaymentError("Payment currency must be a three-letter currency code.", {
      code: "invalid_currency"
    });
  }

  return normalized;
}

function normalizeMetadata(metadata) {
  if (metadata == null) {
    return undefined;
  }

  if (typeof metadata !== "object" || Array.isArray(metadata)) {
    throw new PaymentError("Payment metadata must be an object when provided.", {
      code: "invalid_metadata"
    });
  }

  const normalized = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (value == null) {
      continue;
    }

    if (!/^[A-Za-z0-9_.-]{1,40}$/.test(key)) {
      throw new PaymentError("Payment metadata keys must be 1-40 characters and contain only letters, numbers, dots, underscores, or hyphens.", {
        code: "invalid_metadata"
      });
    }

    if (!["string", "number", "boolean"].includes(typeof value)) {
      throw new PaymentError("Payment metadata values must be strings, numbers, or booleans.", {
        code: "invalid_metadata"
      });
    }

    normalized[key] = String(value).slice(0, 500);
  }

  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

function normalizeStripeError(error) {
  if (error instanceof PaymentError) {
    return error;
  }

  const message = error?.message ?? "Stripe payment request failed.";
  return new PaymentError(message, {
    code: error?.code ?? error?.type ?? "stripe_error",
    statusCode: 502,
    cause: error
  });
}
