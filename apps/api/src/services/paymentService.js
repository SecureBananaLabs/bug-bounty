import Stripe from "stripe";

let testStripeClient;

export class PaymentServiceError extends Error {
  constructor(message, statusCode = 400, code = "PAYMENT_ERROR") {
    super(message);
    this.name = "PaymentServiceError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export function setStripeClientForTest(client) {
  testStripeClient = client;
}

export function resetStripeClientForTest() {
  testStripeClient = undefined;
}

function getStripeClient() {
  if (testStripeClient) {
    return testStripeClient;
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    throw new PaymentServiceError("STRIPE_SECRET_KEY is required to create payment intents", 500, "STRIPE_CONFIGURATION_ERROR");
  }

  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

function validateAmount(amount) {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new PaymentServiceError("amount is required and must be a positive integer in the smallest currency unit");
  }

  return amount;
}

function normalizeCurrency(currency = "usd") {
  if (typeof currency !== "string" || !/^[a-zA-Z]{3}$/.test(currency)) {
    throw new PaymentServiceError("currency must be a 3-letter ISO currency code");
  }

  return currency.toLowerCase();
}

function normalizeMetadata(metadata) {
  if (metadata === undefined) {
    return undefined;
  }

  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    throw new PaymentServiceError("metadata must be an object when provided");
  }

  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => {
      if (value === null || typeof value === "object") {
        throw new PaymentServiceError("metadata values must be strings, numbers, or booleans");
      }

      return [key, String(value)];
    })
  );
}

function stripeErrorMessage(error) {
  if (error?.raw?.message) {
    return error.raw.message;
  }

  return error?.message ?? "Stripe payment intent creation failed";
}

export async function createPaymentIntent(payload = {}) {
  const amount = validateAmount(payload.amount);
  const currency = normalizeCurrency(payload.currency);
  const metadata = normalizeMetadata(payload.metadata);
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
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      provider: "stripe"
    };
  } catch (error) {
    if (error?.type?.startsWith("Stripe") || error?.rawType?.startsWith("Stripe") || error?.raw?.type) {
      throw new PaymentServiceError(stripeErrorMessage(error), error.statusCode ?? 502, error.code ?? error.type ?? "STRIPE_ERROR");
    }

    throw error;
  }
}
