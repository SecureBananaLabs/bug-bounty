import Stripe from "stripe";

// Initialize Stripe with secret key from environment
// Falls back to a clearly invalid key for development so failures are explicit
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder");

/**
 * Create a Stripe PaymentIntent and return the client_secret.
 *
 * @param {Object} payload
 * @param {number} payload.amount - Amount in the smallest currency unit (e.g., cents for USD)
 * @param {string} [payload.currency="usd"] - ISO 4217 currency code
 * @param {Object} [payload.metadata] - Optional metadata to attach to the PaymentIntent
 * @param {string} [payload.description] - Optional description
 * @param {string} [payload.customer] - Optional Stripe Customer ID
 * @returns {Promise<Object>} Payment intent object with client_secret
 */
export async function createPaymentIntent(payload) {
  // --- Input Validation ---
  if (!payload || typeof payload.amount !== "number" || payload.amount <= 0) {
    throw Object.assign(new Error("Invalid payment amount. Must be a positive number."), {
      statusCode: 400,
      stripeCode: null,
    });
  }

  const currency = (payload.currency || "usd").toLowerCase();
  const supportedCurrencies = ["usd", "eur", "gbp", "cad", "aud", "jpy", "cny"];
  if (!supportedCurrencies.includes(currency)) {
    throw Object.assign(
      new Error(`Unsupported currency: ${currency}. Supported: ${supportedCurrencies.join(", ")}`),
      { statusCode: 400, stripeCode: null }
    );
  }

  // --- Build PaymentIntent params ---
  const intentParams = {
    amount: Math.round(payload.amount), // Ensure integer
    currency,
    metadata: payload.metadata || {},
    ...(payload.description && { description: payload.description }),
    ...(payload.customer && { customer: payload.customer }),
  };

  // --- Create PaymentIntent via Stripe SDK ---
  try {
    const paymentIntent = await stripe.paymentIntents.create(intentParams);

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      provider: "stripe",
    };
  } catch (error) {
    // Surface Stripe errors with meaningful messages
    const friendlyMessage = getStripeErrorMessage(error);
    throw Object.assign(new Error(friendlyMessage), {
      statusCode: error.statusCode || 502,
      stripeCode: error.code || null,
      stripeType: error.type || null,
      originalError:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

/**
 * Maps Stripe error codes to human-readable messages.
 */
function getStripeErrorMessage(error) {
  switch (error.type) {
    case "StripeCardError":
      return `Payment declined: ${error.message}`;
    case "StripeRateLimitError":
      return "Too many payment requests. Please try again shortly.";
    case "StripeInvalidRequestError":
      return `Invalid payment request: ${error.message}`;
    case "StripeAPIError":
      return "Payment service is temporarily unavailable. Please try again.";
    case "StripeConnectionError":
      return "Could not connect to payment provider. Check your network.";
    case "StripeAuthenticationError":
      return "Payment provider authentication failed. Contact support.";
    default:
      return error.message || "An unexpected payment error occurred.";
  }
}

/**
 * Retrieve an existing PaymentIntent by ID.
 */
export async function getPaymentIntent(paymentId) {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentId);
    return {
      paymentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      provider: "stripe",
    };
  } catch (error) {
    throw Object.assign(
      new Error(`Failed to retrieve payment: ${error.message}`),
      { statusCode: error.statusCode || 404, stripeCode: error.code || null }
    );
  }
}

/**
 * Confirm a PaymentIntent (for client-side confirmation flows).
 */
export async function confirmPaymentIntent(paymentId) {
  try {
    const paymentIntent = await stripe.paymentIntents.confirm(paymentId);
    return {
      paymentId: paymentIntent.id,
      status: paymentIntent.status,
      provider: "stripe",
    };
  } catch (error) {
    throw Object.assign(
      new Error(`Failed to confirm payment: ${error.message}`),
      { statusCode: error.statusCode || 502, stripeCode: error.code || null }
    );
  }
}
