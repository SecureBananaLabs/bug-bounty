import Stripe from "stripe";

let stripeClient = null;

/**
 * Lazily initialise and return a singleton Stripe client.
 * The secret key is read from the STRIPE_SECRET_KEY environment variable.
 * No keys are ever hardcoded.
 *
 * @returns {Stripe}
 */
export function getStripeClient() {
  if (stripeClient) {
    return stripeClient;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error(
      "Stripe secret key is not configured. Set the STRIPE_SECRET_KEY environment variable."
    );
  }

  stripeClient = new Stripe(secretKey, {
    apiVersion: "2024-06-20",
    maxNetworkRetries: 2,
    timeout: 30000
  });

  return stripeClient;
}

/**
 * Reset the cached client. Intended for tests.
 */
export function resetStripeClient() {
  stripeClient = null;
}
