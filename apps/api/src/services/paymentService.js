import Stripe from "stripe";
import { env } from "../config/env.js";

let stripeClient;

function getStripeClient() {
  // Read the process environment at call time so long-running workers and
  // tests that inject configuration after module load behave predictably.
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY ?? env.stripeSecretKey;
  if (!stripeSecretKey) {
    throw new Error("STRIPE_SECRET_KEY must be configured to create a payment intent");
  }

  stripeClient ??= new Stripe(stripeSecretKey);
  return stripeClient;
}

function validatePaymentPayload(payload) {
  if (!payload || typeof payload !== "object") {
    throw new TypeError("Payment payload is required");
  }

  if (!Number.isSafeInteger(payload.amount) || payload.amount <= 0) {
    throw new TypeError("payload.amount must be a positive integer in the smallest currency unit");
  }

  const currency = payload.currency ?? "usd";
  if (typeof currency !== "string" || !/^[a-z]{3}$/i.test(currency)) {
    throw new TypeError("payload.currency must be a three-letter currency code");
  }

  const request = { amount: payload.amount, currency: currency.toLowerCase() };
  if (payload.metadata !== undefined) {
    if (
      payload.metadata === null ||
      typeof payload.metadata !== "object" ||
      Array.isArray(payload.metadata)
    ) {
      throw new TypeError("payload.metadata must be an object when provided");
    }

    request.metadata = payload.metadata;
  }

  return request;
}

/**
 * Create a Stripe PaymentIntent and expose the stable fields used by callers.
 *
 * The optional client argument is intentionally injectable so unit tests can
 * exercise the service without contacting Stripe or requiring a secret key.
 */
export async function createPaymentIntent(payload, client) {
  const request = validatePaymentPayload(payload);
  const stripe = client ?? getStripeClient();

  try {
    const paymentIntent = await stripe.paymentIntents.create(request);

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: request.amount,
      currency: request.currency,
      provider: "stripe"
    };
  } catch (error) {
    // Preserve Stripe's original error text while keeping a stable service
    // context for logs and API consumers.
    if (error instanceof Error) {
      throw new Error(`Stripe payment intent creation failed: ${error.message}`, { cause: error });
    }
    throw error;
  }
}
