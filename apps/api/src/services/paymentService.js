import Stripe from "stripe";
import { z } from "zod";
import { env } from "../config/env.js";

const paymentPayloadSchema = z.object({
  amount: z
    .number({ required_error: "amount is required" })
    .int("amount must be an integer in the smallest currency unit")
    .positive("amount must be a positive integer"),
  currency: z
    .string()
    .trim()
    .regex(/^[a-z]{3}$/i, "currency must be a 3-letter ISO code")
    .default("usd")
    .transform((currency) => currency.toLowerCase()),
  metadata: z.record(z.string()).optional()
});

let stripeClient;

export class PaymentServiceError extends Error {
  constructor(message, statusCode = 400, cause) {
    super(message);
    this.name = "PaymentServiceError";
    this.statusCode = statusCode;
    this.cause = cause;
  }
}

function getStripeClient() {
  if (!env.stripeSecretKey) {
    throw new PaymentServiceError("STRIPE_SECRET_KEY is required to create payment intents", 500);
  }

  stripeClient ??= new Stripe(env.stripeSecretKey);
  return stripeClient;
}

function parsePaymentPayload(payload) {
  const result = paymentPayloadSchema.safeParse(payload);
  if (!result.success) {
    throw new PaymentServiceError(result.error.issues[0].message, 400, result.error);
  }

  return result.data;
}

export async function createPaymentIntent(payload, options = {}) {
  const parsed = parsePaymentPayload(payload);
  const stripe = options.stripeClient ?? getStripeClient();
  const createParams = {
    amount: parsed.amount,
    currency: parsed.currency,
    ...(parsed.metadata ? { metadata: parsed.metadata } : {})
  };

  try {
    const paymentIntent = await stripe.paymentIntents.create(createParams);

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount ?? parsed.amount,
      currency: paymentIntent.currency ?? parsed.currency,
      provider: "stripe"
    };
  } catch (error) {
    const message = error?.message ?? "Unable to create Stripe PaymentIntent";
    throw new PaymentServiceError(`Stripe error: ${message}`, 502, error);
  }
}
