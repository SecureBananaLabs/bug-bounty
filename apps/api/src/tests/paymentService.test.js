import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import {
  createPaymentIntent,
  PaymentProviderError,
  PaymentValidationError,
  resetStripeClientForTests
} from "../services/paymentService.js";

function createMockStripeClient(responseOverrides = {}) {
  const calls = [];

  return {
    calls,
    client: {
      paymentIntents: {
        create: async (params) => {
          calls.push(params);

          return {
            id: "pi_test_123",
            client_secret: "pi_test_123_secret_abc",
            amount: params.amount,
            currency: params.currency,
            ...responseOverrides
          };
        }
      }
    }
  };
}

test("createPaymentIntent calls Stripe with validated payload and returns client secret", async () => {
  const stripe = createMockStripeClient();

  const result = await createPaymentIntent(
    {
      amount: 2500,
      currency: "USD",
      metadata: {
        proposalId: 42,
        sandbox: true
      }
    },
    { stripeClient: stripe.client }
  );

  assert.deepEqual(stripe.calls, [
    {
      amount: 2500,
      currency: "usd",
      metadata: {
        proposalId: "42",
        sandbox: "true"
      }
    }
  ]);

  assert.deepEqual(result, {
    paymentId: "pi_test_123",
    clientSecret: "pi_test_123_secret_abc",
    amount: 2500,
    currency: "usd",
    provider: "stripe"
  });
});

test("createPaymentIntent defaults currency to usd", async () => {
  const stripe = createMockStripeClient();

  await createPaymentIntent({ amount: 1000 }, { stripeClient: stripe.client });

  assert.deepEqual(stripe.calls, [{ amount: 1000, currency: "usd" }]);
});

test("createPaymentIntent rejects invalid amounts before calling Stripe", async () => {
  const stripe = createMockStripeClient();

  await assert.rejects(
    () => createPaymentIntent({ amount: 0 }, { stripeClient: stripe.client }),
    PaymentValidationError
  );

  assert.deepEqual(stripe.calls, []);
});

test("createPaymentIntent rejects invalid metadata before calling Stripe", async () => {
  const stripe = createMockStripeClient();

  await assert.rejects(
    () =>
      createPaymentIntent(
        {
          amount: 1000,
          metadata: { nested: { unsupported: true } }
        },
        { stripeClient: stripe.client }
      ),
    /metadata\.nested must be a string, number, or boolean/
  );

  assert.deepEqual(stripe.calls, []);
});

test("createPaymentIntent preserves Stripe error messages", async () => {
  const stripeError = new Error("Your card was declined.");
  stripeError.type = "StripeCardError";

  const stripeClient = {
    paymentIntents: {
      create: async () => {
        throw stripeError;
      }
    }
  };

  await assert.rejects(
    () => createPaymentIntent({ amount: 1000 }, { stripeClient }),
    (error) =>
      error instanceof PaymentProviderError &&
      error.message === "Your card was declined." &&
      error.cause === stripeError
  );
});

test("POST /api/payments returns a validation response for invalid payloads", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/api/payments`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ amount: -1 })
  });
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.equal(payload.success, false);
  assert.match(payload.message, /positive integer/);

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

const skipStripeSmoke =
  process.env.STRIPE_PAYMENT_SMOKE_TEST === "1" && process.env.STRIPE_SECRET_KEY
    ? false
    : "Set STRIPE_PAYMENT_SMOKE_TEST=1 and STRIPE_SECRET_KEY to run the live Stripe smoke test.";

test(
  "createPaymentIntent can create a real Stripe test-mode PaymentIntent",
  { skip: skipStripeSmoke },
  async () => {
    resetStripeClientForTests();

    const result = await createPaymentIntent({
      amount: 100,
      currency: "usd",
      metadata: {
        source: "payment-service-smoke"
      }
    });

    assert.match(result.paymentId, /^pi_/);
    assert.ok(result.clientSecret);
    assert.equal(result.amount, 100);
    assert.equal(result.currency, "usd");
  }
);
