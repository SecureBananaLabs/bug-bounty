import Stripe from "stripe";

let stripeClient = null;

function serviceError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

export function initStripe({ secretKey = process.env.STRIPE_SECRET_KEY, client } = {}) {
  if (client) {
    stripeClient = client;
    return stripeClient;
  }

  if (!secretKey) {
    throw serviceError("STRIPE_SECRET_KEY is required to create a Stripe PaymentIntent", 500);
  }

  stripeClient = new Stripe(secretKey);
  return stripeClient;
}

export function resetStripeForTests() {
  stripeClient = null;
}

function getStripeClient() {
  return stripeClient ?? initStripe();
}

function validateAmount(amount) {
  if (amount === undefined || amount === null) {
    throw serviceError("amount is required and must be a positive integer in the smallest currency unit");
  }
  if (!Number.isInteger(amount) || amount <= 0) {
    throw serviceError("amount must be a positive integer in the smallest currency unit");
  }
  return amount;
}

function validateCurrency(currency = "usd") {
  if (typeof currency !== "string" || !/^[a-z]{3}$/i.test(currency)) {
    throw serviceError("currency must be a 3-letter ISO currency code");
  }
  return currency.toLowerCase();
}

function validateMetadata(metadata = {}) {
  if (metadata === null || Array.isArray(metadata) || typeof metadata !== "object") {
    throw serviceError("metadata must be an object when provided");
  }

  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => [key, String(value)])
  );
}

export async function createPaymentIntent(payload = {}) {
  const amount = validateAmount(payload.amount);
  const currency = validateCurrency(payload.currency);
  const metadata = validateMetadata(payload.metadata);
  const stripe = getStripeClient();

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata
    });

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      provider: "stripe"
    };
  } catch (error) {
    if (error?.type?.startsWith?.("Stripe") && error.message) {
      throw serviceError(error.message, error.statusCode ?? 502);
    }

    throw error;
  }
}
