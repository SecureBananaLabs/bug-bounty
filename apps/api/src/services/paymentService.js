import Stripe from "stripe";

const DEFAULT_CURRENCY = "usd";

function validatePaymentPayload(payload = {}) {
  const amount = payload.amount;

  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error("Payment amount must be a positive integer in the smallest currency unit.");
  }

  const currency = payload.currency ?? DEFAULT_CURRENCY;
  if (typeof currency !== "string" || !/^[a-zA-Z]{3}$/.test(currency)) {
    throw new Error("Payment currency must be a three-letter ISO currency code.");
  }

  return {
    amount,
    currency: currency.toLowerCase(),
    metadata: payload.metadata && typeof payload.metadata === "object" ? payload.metadata : undefined
  };
}

function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is required to create Stripe payment intents.");
  }

  return new Stripe(secretKey);
}

export async function createPaymentIntent(payload, options = {}) {
  const { amount, currency, metadata } = validatePaymentPayload(payload);
  const stripe = options.stripeClient ?? getStripeClient();

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
    const message = error?.message || "Stripe payment intent creation failed.";
    throw new Error(`Stripe payment intent creation failed: ${message}`);
  }
}

export const __test__ = { validatePaymentPayload };
