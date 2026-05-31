import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import {
  createPaymentIntent,
  resetStripeClientForTest,
  setStripeClientForTest
} from "../services/paymentService.js";

function mockStripeClient({ response, error } = {}) {
  const calls = [];

  return {
    calls,
    client: {
      paymentIntents: {
        async create(payload) {
          calls.push(payload);

          if (error) {
            throw error;
          }

          return response ?? {
            id: "pi_mocked",
            client_secret: "pi_mocked_secret",
            amount: payload.amount,
            currency: payload.currency
          };
        }
      }
    }
  };
}

async function withServer(run) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test.afterEach(() => {
  resetStripeClientForTest();
});

test("createPaymentIntent calls Stripe with validated payment fields", async () => {
  const stripe = mockStripeClient();
  setStripeClientForTest(stripe.client);

  const result = await createPaymentIntent({
    amount: 2599,
    metadata: {
      jobId: "job_123",
      urgent: true
    }
  });

  assert.deepEqual(stripe.calls, [
    {
      amount: 2599,
      currency: "usd",
      metadata: {
        jobId: "job_123",
        urgent: "true"
      }
    }
  ]);
  assert.deepEqual(result, {
    paymentId: "pi_mocked",
    clientSecret: "pi_mocked_secret",
    amount: 2599,
    currency: "usd",
    provider: "stripe"
  });
});

test("createPaymentIntent rejects invalid amount before calling Stripe", async () => {
  const stripe = mockStripeClient();
  setStripeClientForTest(stripe.client);

  await assert.rejects(
    createPaymentIntent({ amount: 0 }),
    /amount is required and must be a positive integer/
  );
  assert.deepEqual(stripe.calls, []);
});

test("createPaymentIntent preserves Stripe API error messages", async () => {
  const stripeError = new Error("Your card was declined");
  stripeError.type = "StripeCardError";
  stripeError.statusCode = 402;

  const stripe = mockStripeClient({ error: stripeError });
  setStripeClientForTest(stripe.client);

  await assert.rejects(
    createPaymentIntent({ amount: 1200, currency: "USD" }),
    (error) => {
      assert.equal(error.message, "Your card was declined");
      assert.equal(error.statusCode, 402);
      assert.equal(error.code, "StripeCardError");
      return true;
    }
  );
});

test("POST /api/payments returns client secret and payment id", async () => {
  const stripe = mockStripeClient();
  setStripeClientForTest(stripe.client);

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ amount: 4500, currency: "eur" })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.paymentId, "pi_mocked");
    assert.equal(payload.data.clientSecret, "pi_mocked_secret");
    assert.deepEqual(stripe.calls, [{ amount: 4500, currency: "eur" }]);
  });
});

test("POST /api/payments returns validation errors without Stripe credentials", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ amount: -1 })
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.match(payload.message, /amount is required/);
  });
});

test(
  "createPaymentIntent can run against Stripe test mode when explicitly enabled",
  {
    skip:
      process.env.STRIPE_PAYMENT_SMOKE === "true" && process.env.STRIPE_SECRET_KEY
        ? false
        : "Set STRIPE_PAYMENT_SMOKE=true and STRIPE_SECRET_KEY to run live Stripe smoke test"
  },
  async () => {
    const result = await createPaymentIntent({
      amount: 100,
      currency: "usd",
      metadata: { source: "securebanana-smoke" }
    });

    assert.match(result.paymentId, /^pi_/);
    assert.match(result.clientSecret, /^pi_/);
    assert.equal(result.provider, "stripe");
  }
);
