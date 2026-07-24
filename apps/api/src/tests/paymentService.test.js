import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { createPaymentIntent } from "../services/paymentService.js";

function createMockStripeClient({ response, error } = {}) {
  const calls = [];

  return {
    calls,
    client: {
      paymentIntents: {
        create: async (payload) => {
          calls.push(payload);
          if (error) {
            throw error;
          }

          return (
            response ?? {
              id: "pi_test_123",
              client_secret: "pi_test_123_secret_abc"
            }
          );
        }
      }
    }
  };
}

test("createPaymentIntent creates a Stripe PaymentIntent with normalized params", async () => {
  const { calls, client } = createMockStripeClient();

  const result = await createPaymentIntent(
    {
      amount: 2500,
      currency: "USD",
      metadata: {
        orderId: "order_123",
        retry: 1,
        live: false
      }
    },
    { stripeClient: client }
  );

  assert.deepEqual(calls, [
    {
      amount: 2500,
      currency: "usd",
      metadata: {
        orderId: "order_123",
        retry: "1",
        live: "false"
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
  const { calls, client } = createMockStripeClient();

  await createPaymentIntent({ amount: 1200 }, { stripeClient: client });

  assert.deepEqual(calls, [
    {
      amount: 1200,
      currency: "usd"
    }
  ]);
});

test("createPaymentIntent rejects invalid amounts before calling Stripe", async () => {
  const { calls, client } = createMockStripeClient();

  await assert.rejects(
    () => createPaymentIntent(null, { stripeClient: client }),
    /payload must be an object/
  );

  await assert.rejects(
    () => createPaymentIntent({ amount: 0 }, { stripeClient: client }),
    /positive integer/
  );

  await assert.rejects(
    () => createPaymentIntent({ amount: 12.5 }, { stripeClient: client }),
    /positive integer/
  );

  assert.deepEqual(calls, []);
});

test("createPaymentIntent preserves Stripe error messages", async () => {
  const { client } = createMockStripeClient({
    error: Object.assign(new Error("Your card was declined."), {
      type: "StripeCardError"
    })
  });

  await assert.rejects(
    () => createPaymentIntent({ amount: 2500 }, { stripeClient: client }),
    (error) => {
      assert.equal(error.statusCode, 502);
      assert.match(error.message, /Your card was declined/);
      return true;
    }
  );
});

test("POST /api/payments returns validation errors as API responses", async () => {
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
  assert.deepEqual(payload, {
    success: false,
    message: "Payment amount must be a positive integer in the smallest currency unit."
  });

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test(
  "createPaymentIntent can run a live Stripe test-mode smoke check",
  {
    skip:
      process.env.STRIPE_PAYMENT_SMOKE === "true" && process.env.STRIPE_SECRET_KEY
        ? false
        : "Set STRIPE_PAYMENT_SMOKE=true and STRIPE_SECRET_KEY to run the live Stripe smoke check."
  },
  async () => {
    const result = await createPaymentIntent({
      amount: 100,
      currency: "usd",
      metadata: { smoke: "true" }
    });

    assert.match(result.paymentId, /^pi_/);
    assert.match(result.clientSecret, /_secret_/);
    assert.equal(result.amount, 100);
    assert.equal(result.currency, "usd");
  }
);
