import Stripe from "stripe";
import { env } from "../config/env.js";

/**
 * List of ISO 4217 currency codes supported by Stripe (lowercase, as Stripe expects).
 * This covers the most commonly used currencies. See https://stripe.com/docs/currencies
 * for the full list.
 */
const SUPPORTED_CURRENCIES = new Set([
  "usd", "eur", "gbp", "cad", "aud", "jpy", "chf", "sek", "nok", "dkk",
  "nzd", "sgd", "hkd", "pln", "czk", "brl", "mxn", "myr", "php", "thb",
  "inr", "krw", "twd", "ils", "zar", "rub", "try", "aed", "sar", "bgn",
  "ron", "huf", "uah", "clp", "cop", "pen", "ars", "vnd", "idr"
]);

let stripeClient = null;

/**
 * Lazily initialise the Stripe client so that test environments without a
 * STRIPE_SECRET_KEY can still import this module without crashing.
 */
function getStripeClient() {
  if (!stripeClient) {
    if (!env.stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured. Set the STRIPE_SECRET_KEY environment variable.");
    }
    stripeClient = new Stripe(env.stripeSecretKey, {
      apiVersion: "2024-06-20"
    });
  }
  return stripeClient;
}

/**
 * Validate the amount for a Stripe PaymentIntent.
 * Stripe requires amounts as positive integers in the smallest currency unit (cents).
 */
function validateAmount(amount) {
  if (amount == null) {
    return { valid: false, error: "Amount is required." };
  }
  if (!Number.isInteger(amount)) {
    return { valid: false, error: "Amount must be an integer (in smallest currency unit, e.g. cents)." };
  }
  if (amount <= 0) {
    return { valid: false, error: "Amount must be a positive integer." };
  }
  return { valid: true };
}

/**
 * Validate the currency code against Stripe's supported currencies.
 */
function validateCurrency(currency) {
  const normalised = (currency ?? "usd").toLowerCase();
  if (!SUPPORTED_CURRENCIES.has(normalised)) {
    return {
      valid: false,
      error: `Currency "${currency}" is not supported. Use a valid ISO 4217 currency code supported by Stripe.`
    };
  }
  return { valid: true, value: normalised };
}

/**
 * Create a Stripe PaymentIntent and return the client_secret for frontend use.
 *
 * @param {Object} payload
 * @param {number} payload.amount  - Amount in smallest currency unit (e.g. cents for USD).
 * @param {string} [payload.currency] - ISO 4217 currency code, defaults to "usd".
 * @param {object} [payload.metadata] - Optional metadata to attach to the PaymentIntent.
 * @returns {Promise<Object>} - On success: { clientSecret, paymentId, amount, currency, provider }
 *                             - On error:   { error: string }
 */
export async function createPaymentIntent(payload) {
  // --- Validate amount ---
  const amountCheck = validateAmount(payload?.amount);
  if (!amountCheck.valid) {
    return { error: amountCheck.error };
  }

  // --- Validate currency ---
  const currencyCheck = validateCurrency(payload?.currency);
  if (!currencyCheck.valid) {
    return { error: currencyCheck.error };
  }

  const amount = payload.amount;
  const currency = currencyCheck.value;
  const metadata = payload.metadata ?? {};

  // --- Call Stripe API ---
  try {
    const stripe = getStripeClient();
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata,
      automatic_payment_methods: { enabled: true }
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      provider: "stripe"
    };
  } catch (err) {
    // Surface meaningful Stripe error messages
    const message =
      err?.raw?.message ?? err?.message ?? "An unexpected error occurred while creating the payment intent.";
    return { error: message };
  }
}
