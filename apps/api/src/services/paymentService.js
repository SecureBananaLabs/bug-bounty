import { env } from "../config/env.js";

const SUPPORTED_CURRENCIES = new Set(["usd", "eur", "gbp"]);
const DEFAULT_PAYMENT_METHOD_TYPES = ["card"];

let stripeClient;

export class PaymentError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = "PaymentError";
    this.statusCode = statusCode;
  }
}

export function setStripeClientForTesting(client) {
  stripeClient = client;
}

export function calculatePlatformFee(amount, feePercent = env.platformFeePercent) {
  const normalizedPercent = Number.isFinite(feePercent) && feePercent >= 0 ? feePercent : 0;
  return Math.round(amount * (normalizedPercent / 100));
}

async function getStripeClient() {
  if (stripeClient) {
    return stripeClient;
  }

  if (!env.stripeSecretKey) {
    throw new PaymentError("Stripe is not configured", 503);
  }

  const { default: Stripe } = await import("stripe");
  stripeClient = new Stripe(env.stripeSecretKey);
  return stripeClient;
}

function normalizeCurrency(currency = "usd") {
  const normalized = String(currency).trim().toLowerCase();

  if (!SUPPORTED_CURRENCIES.has(normalized)) {
    throw new PaymentError("Unsupported payment currency");
  }

  return normalized;
}

function normalizeAmount(amount) {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new PaymentError("Payment amount must be a positive integer in the smallest currency unit");
  }

  if (amount < 50) {
    throw new PaymentError("Payment amount is below the Stripe minimum");
  }

  return amount;
}

function buildPaymentMetadata(payload, platformFeeAmount, netAmount) {
  return {
    job_id: payload.jobId ?? "",
    proposal_id: payload.proposalId ?? "",
    payer_id: payload.payerId ?? "",
    platform_fee_amount: String(platformFeeAmount),
    net_amount: String(netAmount)
  };
}

export async function createPaymentIntent(payload = {}) {
  const amount = normalizeAmount(payload.amount);
  const currency = normalizeCurrency(payload.currency);
  const platformFeeAmount = calculatePlatformFee(amount);
  const netAmount = amount - platformFeeAmount;
  const client = await getStripeClient();

  const paymentIntentPayload = {
    amount,
    currency,
    capture_method: "manual",
    payment_method_types: DEFAULT_PAYMENT_METHOD_TYPES,
    metadata: buildPaymentMetadata(payload, platformFeeAmount, netAmount)
  };

  if (payload.description) {
    paymentIntentPayload.description = payload.description;
  }

  if (payload.freelancerAccountId) {
    paymentIntentPayload.application_fee_amount = platformFeeAmount;
    paymentIntentPayload.transfer_data = {
      destination: payload.freelancerAccountId
    };
  }

  const intent = await client.paymentIntents.create(paymentIntentPayload);

  return {
    paymentId: intent.id,
    clientSecret: intent.client_secret,
    amount,
    currency,
    provider: "stripe",
    captureMethod: intent.capture_method ?? paymentIntentPayload.capture_method,
    platformFeeAmount,
    netAmount,
    status: intent.status
  };
}
