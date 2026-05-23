import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent, PaymentServiceError } from "../services/paymentService.js";

function createMockStripeClient(assertCreateParams) {
  return {
    paymentIntents: {
      async create(params) {
        assertCreateParams(params);
        return {
          id: "pi_test_123",
          client_secret: "pi_test_123_secret_mock",
          amount: params.amount,
          currency: params.currency
        };
      }
    }
  };
}

test("createPaymentIntent validates amount before calling Stripe", async () => {
  let called = false;
  const stripeClient = createMockStripeClient(() => {
    called = true;
  });

  await assert.rejects(
    () => createPaymentIntent({ amount: 0 }, { stripeClient }),
    /positive integer/
  );

  assert.equal(called, false);
});

test("createPaymentIntent defaults currency, normalizes metadata, and maps Stripe response", async () => {
  const stripeClient = createMockStripeClient((params) => {
    assert.deepEqual(params, {
      amount: 2500,
      currency: "usd",
      metadata: {
        jobId: "42",
        urgent: "true"
      }
    });
  });

  const payment = await createPaymentIntent(
    {
      amount: 2500,
      metadata: {
        jobId: 42,
        urgent: true
      }
    },
    { stripeClient }
  );

  assert.deepEqual(payment, {
    paymentId: "pi_test_123",
    clientSecret: "pi_test_123_secret_mock",
    amount: 2500,
    currency: "usd",
    provider: "stripe"
  });
});

test("createPaymentIntent passes normalized currency to Stripe", async () => {
  const stripeClient = createMockStripeClient((params) => {
    assert.equal(params.currency, "eur");
  });

  await createPaymentIntent({ amount: 1200, currency: " EUR " }, { stripeClient });
});

test("createPaymentIntent preserves Stripe API error messages", async () => {
  const stripeClient = {
    paymentIntents: {
      async create() {
        const error = new Error("Your card was declined.");
        error.type = "StripeCardError";
        error.code = "card_declined";
        throw error;
      }
    }
  };

  await assert.rejects(
    () => createPaymentIntent({ amount: 1200, currency: "usd" }, { stripeClient }),
    (error) => {
      assert.equal(error instanceof PaymentServiceError, true);
      assert.equal(error.message, "Your card was declined.");
      assert.equal(error.statusCode, 502);
      assert.equal(error.details.stripeType, "StripeCardError");
      return true;
    }
  );
});

test(
  "createPaymentIntent creates a live Stripe test-mode PaymentIntent when explicitly enabled",
  {
    skip:
      process.env.STRIPE_PAYMENT_SMOKE !== "true" ||
      !process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_")
  },
  async () => {
    const payment = await createPaymentIntent({
      amount: 100,
      currency: "usd",
      metadata: {
        smoke: "true"
      }
    });

    assert.match(payment.paymentId, /^pi_/);
    assert.match(payment.clientSecret, /^pi_.*_secret_/);
    assert.equal(payment.amount, 100);
    assert.equal(payment.currency, "usd");
  }
);
