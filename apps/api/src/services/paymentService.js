import Stripe from "stripe";

const STRIPE_API_VERSION = "2026-02-25.clover";

export class PaymentValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "PaymentValidationError";
    this.statusCode = 400;
  }
}

export class PaymentProviderError extends Error {
  constructor(message, options) {
    super(message, options);
    this.name = "PaymentProviderError";
    this.statusCode = 502;
  }
}

let stripeClient;
let stripeClientFactory = createStripeClient;

function createStripeClient(secretKey) {
  return new Stripe(secretKey, {
    apiVersion: STRIPE_API_VERSION
  });
}

function getStripeClient() {
  if (stripeClient) {
    return stripeClient;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new PaymentProviderError("STRIPE_SECRET_KEY is required to create payment intents.");
  }

  stripeClient = stripeClientFactory(secretKey);
  return stripeClient;
}

function validateAmount(amount) {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new PaymentValidationError("Payment amount is required and must be a positive integer.");
  }

  return amount;
}

function validateCurrency(currency) {
  if (currency === undefined || currency === null || currency === "") {
    return "usd";
  }

  if (typeof currency !== "string" || !/^[a-z]{3}$/i.test(currency)) {
    throw new PaymentValidationError("Payment currency must be a three-letter ISO currency code.");
  }

  return currency.toLowerCase();
}

function validateMetadata(metadata) {
  if (metadata === undefined) {
    return undefined;
  }

  if (metadata === null || Array.isArray(metadata) || typeof metadata !== "object") {
    throw new PaymentValidationError("Payment metadata must be an object when provided.");
  }

  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => {
      if (value === null || value === undefined || typeof value === "object") {
        throw new PaymentValidationError("Payment metadata values must be strings, numbers, or booleans.");
      }

      return [key, String(value)];
    })
  );
}

function isStripeError(error) {
  return typeof error?.type === "string" && error.type.startsWith("Stripe");
}

export function setStripeClientFactoryForTests(factory) {
  stripeClient = undefined;
  stripeClientFactory = factory;
}

export function resetStripeClientForTests() {
  stripeClient = undefined;
  stripeClientFactory = createStripeClient;
}

export async function createPaymentIntent(payload = {}) {
  const amount = validateAmount(payload.amount);
  const currency = validateCurrency(payload.currency);
  const metadata = validateMetadata(payload.metadata);
  const params = { amount, currency };

  if (metadata) {
    params.metadata = metadata;
  }

  try {
    const paymentIntent = await getStripeClient().paymentIntents.create(params);

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount,
      currency,
      provider: "stripe"
    };
  } catch (error) {
    if (error instanceof PaymentValidationError || error instanceof PaymentProviderError) {
      throw error;
    }

    if (isStripeError(error)) {
      throw new PaymentProviderError(error.message, { cause: error });
    }

    throw error;
  }
}
