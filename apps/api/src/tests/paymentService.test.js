import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent, buildPaymentIntentParams, PaymentError } from "../services/paymentService.js";

test("builds Stripe PaymentIntent params with a usd default", () => {
  assert.deepEqual(buildPaymentIntentParams({ amount: 2500 }), {
    amount: 2500,
    currency: "usd"
  });
});

test("passes validated amount, currency, and metadata to Stripe", async () => {
  let receivedParams;
  const stripe = {
    paymentIntents: {
      create: async (params) => {
        receivedParams = params;
        return {
          id: "pi_test_123",
          client_secret: "pi_test_123_secret_456"
        };
      }
    }
  };

  const result = await createPaymentIntent({
    amount: 1099,
    currency: "CAD",
    metadata: {
      jobId: "job_123",
      milestone: "deposit",
      urgent: true
    }
  }, { stripe });

  assert.deepEqual(receivedParams, {
    amount: 1099,
    currency: "cad",
    metadata: {
      jobId: "job_123",
      milestone: "deposit",
      urgent: "true"
    }
  });
  assert.deepEqual(result, {
    paymentId: "pi_test_123",
    clientSecret: "pi_test_123_secret_456",
    amount: 1099,
    currency: "cad",
    provider: "stripe"
  });
});

test("rejects missing and invalid amounts before calling Stripe", async () => {
  const stripe = {
    paymentIntents: {
      create: async () => {
        throw new Error("Stripe should not be called for invalid amounts");
      }
    }
  };

  await assert.rejects(
    createPaymentIntent({ currency: "usd" }, { stripe }),
    (error) => error instanceof PaymentError
      && error.code === "invalid_amount"
      && error.message.includes("positive integer")
  );

  await assert.rejects(
    createPaymentIntent({ amount: 12.34, currency: "usd" }, { stripe }),
    (error) => error instanceof PaymentError
      && error.code === "invalid_amount"
      && error.message.includes("positive integer")
  );
});

test("requires STRIPE_SECRET_KEY only after payload validation passes", async () => {
  await assert.rejects(
    createPaymentIntent({ amount: 100, currency: "usd" }),
    (error) => error instanceof PaymentError
      && error.code === "stripe_not_configured"
      && error.statusCode === 500
      && error.message.includes("STRIPE_SECRET_KEY")
  );
});

test("rejects invalid currencies and metadata before calling Stripe", () => {
  assert.throws(
    () => buildPaymentIntentParams({ amount: 100, currency: "usdollar" }),
    (error) => error instanceof PaymentError && error.code === "invalid_currency"
  );

  assert.throws(
    () => buildPaymentIntentParams({ amount: 100, metadata: ["job_123"] }),
    (error) => error instanceof PaymentError && error.code === "invalid_metadata"
  );
});

test("preserves Stripe API error messages", async () => {
  const stripeError = new Error("No such customer: cus_missing");
  stripeError.type = "StripeInvalidRequestError";
  stripeError.code = "resource_missing";
  const stripe = {
    paymentIntents: {
      create: async () => {
        throw stripeError;
      }
    }
  };

  await assert.rejects(
    createPaymentIntent({ amount: 1000, currency: "usd" }, { stripe }),
    (error) => error instanceof PaymentError
      && error.statusCode === 502
      && error.code === "resource_missing"
      && error.message === "No such customer: cus_missing"
  );
});
