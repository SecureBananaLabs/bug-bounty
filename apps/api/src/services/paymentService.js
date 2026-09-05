import Stripe from "stripe";
import { env } from "../config/env.js";

// ─── Stripe SDK lazy initialisation ──────────────────────
let stripeInstance = null;
function getStripe() {
  if (!stripeInstance) {
    const key = env.stripeSecretKey;
    if (!key) {
      throw Object.assign(
        new Error("Stripe secret key is not configured on the server"),
        { statusCode: 500 }
      );
    }
    stripeInstance = new Stripe(key, {
      apiVersion: "2024-06-20"
    });
  }
  return stripeInstance;
}

// ─── Supported currencies (ISO 4217 lower-case codes) ────
const SUPPORTED_CURRENCIES = new Set([
  "usd", "eur", "gbp", "cad", "aud", "jpy", "chf", "pln",
  "sek", "nok", "dkk", "brl", "mxn", "sgd", "hkd", "nzd",
  "inr"
]);

// ─── Minimum amounts per currency (in smallest unit) ─────
const MIN_AMOUNTS = {
  usd: 50,   eur: 50,   gbp: 30,   cad: 50,
  aud: 50,   jpy: 50,   chf: 50,   pln: 200,
  sek: 300,  nok: 300,  dkk: 250,  brl: 50,
  mxn: 1000, sgd: 50,   hkd: 400,  nzd: 50,
  inr: 50
};

// ─── Zero-decimal currencies (amount = real value, no cents)
const ZERO_DECIMAL = new Set(["jpy"]);

/**
 * Create a Stripe PaymentIntent.
 *
 * @param {object} payload
 * @param {number} payload.amount   – amount in major currency units (e.g. 25.00)
 * @param {string} [payload.currency="usd"] – ISO 4217 currency code
 * @param {string} [payload.jobId]  – optional job reference stored in metadata
 * @returns {Promise<object>} – { paymentId, clientSecret, amount, currency, provider }
 */
export async function createPaymentIntent(payload) {
  const { amount, currency: rawCurrency, jobId } = payload;

  // ── Validate amount ────────────────────────────────────
  if (amount == null || typeof amount !== "number" || !Number.isFinite(amount)) {
    throw Object.assign(
      new Error("amount is required and must be a finite number"),
      { statusCode: 400 }
    );
  }
  if (amount <= 0) {
    throw Object.assign(
      new Error("amount must be greater than zero"),
      { statusCode: 400 }
    );
  }

  // ── Validate currency ──────────────────────────────────
  const currency = (rawCurrency ?? "usd").toLowerCase();
  if (!SUPPORTED_CURRENCIES.has(currency)) {
    throw Object.assign(
      new Error(`Unsupported currency: ${currency}`),
      { statusCode: 400 }
    );
  }

  // ── Convert to smallest unit & enforce minimum ─────────
  const unitAmount = ZERO_DECIMAL.has(currency)
    ? Math.round(amount)
    : Math.round(amount * 100);

  const minAmount = MIN_AMOUNTS[currency] ?? 50;
  if (unitAmount < minAmount) {
    throw Object.assign(
      new Error(
        `Amount too small for ${currency.toUpperCase()}. ` +
        `Minimum is ${minAmount} ${ZERO_DECIMAL.has(currency) ? "units" : "cents"}.`
      ),
      { statusCode: 400 }
    );
  }

  // ── Build metadata ─────────────────────────────────────
  const metadata = {};
  if (jobId) metadata.jobId = jobId;

  // ── Create PaymentIntent via Stripe SDK ────────────────
  const stripe = getStripe();
  const intent = await stripe.paymentIntents.create({
    amount: unitAmount,
    currency,
    metadata,
    automatic_payment_methods: { enabled: true }
  });

  return {
    paymentId: intent.id,
    clientSecret: intent.client_secret,
    amount: intent.amount,
    currency: intent.currency,
    provider: "stripe"
  };
}
