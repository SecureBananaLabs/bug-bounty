import Stripe from "stripe";

let cachedClient = null;

/**
 * Lazily initialise and return a singleton Stripe client.
 * Throws if STRIPE_SECRET_KEY is not configured.
 */
export function getStripeClient() {
  if (cachedClient) {
    return cachedClient;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey || secretKey.trim() === "") {
    throw new Error(
      "Stripe is not configured: the STRIPE_SECRET_KEY environment variable is missing."
    );
  }

  cachedClient = new Stripe(secretKey, {
    apiVersion: "2024-06-20",
    maxNetworkRetries: 2,
    timeout: 30000
  });

  return cachedClient;
}

/**
 * Reset the cached client. Intended for tests.
 */
export function resetStripeClient() {
  cachedClient = null;
}
