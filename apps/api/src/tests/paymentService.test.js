import test from "node:test";
import assert from "node:assert/strict";
import {
  PaymentProviderError,
  createPaymentIntent,
  toStripeAmount
} from "../services/paymentService.js";

test("createPaymentIntent creates a Stripe payment intent and returns client secret", async () => {
  const calls = [];
  const stripe = {
    paymentIntents: {
      create: async (payload) => {
        calls.push(payload);
        return {
          id: "pi_test_123",
          client_secret: "pi_test_123_secret_abc",
          status: "requires_payment_method"
        };
      }
    }
  };

  const result = await createPaymentIntent(
    {
      amount: 42.5,
      currency: "USD",
      description: "Milestone deposit",
      jobId: "job_123",
      proposalId: "prop_456",
      userId: "user_789"
    },
    stripe
  );

  assert.deepEqual(calls[0], {
    amount: 4250,
    currency: "usd",
    automatic_payment_methods: { enabled: true },
    description: "Milestone deposit",
    metadata: {
      jobId: "job_123",
      proposalId: "prop_456",
      userId: "user_789"
    }
  });
  assert.deepEqual(result, {
    paymentId: "pi_test_123",
    clientSecret: "pi_test_123_secret_abc",
    amount: 4250,
    currency: "usd",
    provider: "stripe",
    status: "requires_payment_method"
  });
});

test("toStripeAmount handles zero-decimal currencies", () => {
  assert.equal(toStripeAmount(500, "jpy"), 500);
  assert.equal(toStripeAmount(12.34, "usd"), 1234);
});

test("createPaymentIntent wraps provider errors", async () => {
  const stripe = {
    paymentIntents: {
      create: async () => {
        throw new Error("card network unavailable");
      }
    }
  };

  await assert.rejects(
    () => createPaymentIntent({ amount: 10 }, stripe),
    (error) => {
      assert.equal(error instanceof PaymentProviderError, true);
      assert.equal(error.message, "card network unavailable");
      assert.equal(error.statusCode, 502);
      return true;
    }
  );
});
