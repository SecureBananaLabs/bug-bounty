import Stripe from "stripe";
import { env } from "../config/env.js";
import { z } from "zod";

const stripe = new Stripe(env.stripeSecretKey);

const paymentPayloadSchema = z.object({
  amount: z.number().int().positive("amount must be a positive integer"),
  currency: z.string().default("usd").optional(),
  metadata: z.record(z.string()).optional()
});

export async function createPaymentIntent(payload) {
  try {
    const validated = paymentPayloadSchema.parse(payload);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: validated.amount,
      currency: validated.currency || "usd",
      ...(validated.metadata && { metadata: validated.metadata })
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldError = error.errors[0];
      throw new Error(
        `Validation error: ${fieldError.path.join(".")} - ${fieldError.message}`
      );
    }

    if (error.type === "StripeCardError") {
      throw new Error(`Card error: ${error.message}`);
    }

    if (error.type === "StripeInvalidRequestError") {
      throw new Error(`Invalid request: ${error.message}`);
    }

    if (error.type === "StripeAPIError") {
      throw new Error(`Stripe API error: ${error.message}`);
    }

    throw error;
  }
}
