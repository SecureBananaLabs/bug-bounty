import test, { afterEach } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { env } from "../config/env.js";
import {
  clearStripeClientForTests,
  createPaymentIntent,
  setStripeClientForTests
} from "../services/paymentService.js";

afterEach(() => {
  clearStripeClientForTests();
});

function createMockStripeClient(handler) {
  const calls = [];
  return {
    calls,
    paymentIntents: {
      async create(params, options) {
        calls.push({ params, options });
        return handler(params, options);
      }
    }
  };
}

async function withServer(app, callback) {
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  try {
    await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("createPaymentIntent creates a Stripe PaymentIntent with normalized payload", async () => {
  const stripeClient = createMockStripeClient((params) => ({
    id: "pi_test_123",
    client_secret: "pi_test_123_secret_456",
    amount: params.amount,
    currency: params.currency,
    status: "requires_payment_method"
  }));
  setStripeClientForTests(stripeClient);

  const result = await createPaymentIntent({
    amount: 2500,
    currency: "USD",
    metadata: {
      jobId: "job_123",
      invoiceNumber: 42,
      expedited: false
    },
    idempotencyKey: " checkout-job-123 "
  });

  assert.deepEqual(stripeClient.calls, [
    {
      params: {
        amount: 2500,
        currency: "usd",
        automatic_payment_methods: {
          enabled: true
        },
        metadata: {
          jobId: "job_123",
          invoiceNumber: "42",
          expedited: "false"
        }
      },
      options: {
        idempotencyKey: "checkout-job-123"
      }
    }
  ]);
  assert.deepEqual(result, {
    paymentId: "pi_test_123",
    clientSecret: "pi_test_123_secret_456",
    amount: 2500,
    currency: "usd",
    status: "requires_payment_method",
    provider: "stripe"
  });
});

test("createPaymentIntent defaults currency to usd", async () => {
  const stripeClient = createMockStripeClient((params) => ({
    id: "pi_default_currency",
    client_secret: "pi_default_currency_secret",
    amount: params.amount,
    currency: params.currency,
    status: "requires_payment_method"
  }));
  setStripeClientForTests(stripeClient);

  await createPaymentIntent({ amount: 500 });

  assert.equal(stripeClient.calls[0].params.currency, "usd");
});

test("createPaymentIntent rejects invalid payloads before Stripe is called", async () => {
  let wasStripeCalled = false;
  setStripeClientForTests({
    paymentIntents: {
      async create() {
        wasStripeCalled = true;
      }
    }
  });

  await assert.rejects(
    () => createPaymentIntent({ amount: 0 }),
    /amount must be a positive integer/
  );
  await assert.rejects(
    () => createPaymentIntent({ amount: 1000, currency: "us-dollar" }),
    /currency must be a three-letter ISO currency code/
  );
  await assert.rejects(
    () => createPaymentIntent({ amount: 1000, metadata: ["not", "an", "object"] }),
    /metadata must be an object/
  );

  assert.equal(wasStripeCalled, false);
});

test("createPaymentIntent preserves Stripe error messages and status codes", async () => {
  const stripeError = new Error("Your card was declined.");
  stripeError.statusCode = 402;
  setStripeClientForTests(
    createMockStripeClient(() => {
      throw stripeError;
    })
  );

  await assert.rejects(
    () => createPaymentIntent({ amount: 1000 }),
    (error) => {
      assert.equal(error.message, "Your card was declined.");
      assert.equal(error.statusCode, 402);
      assert.equal(error.expose, true);
      return true;
    }
  );
});

test("POST /api/payments returns the PaymentIntent client secret", async () => {
  setStripeClientForTests(
    createMockStripeClient((params) => ({
      id: "pi_route_123",
      client_secret: "pi_route_123_secret",
      amount: params.amount,
      currency: params.currency,
      status: "requires_payment_method"
    }))
  );

  await withServer(createApp(), async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        amount: 1999,
        currency: "eur"
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.paymentId, "pi_route_123");
    assert.equal(payload.data.clientSecret, "pi_route_123_secret");
    assert.equal(payload.data.currency, "eur");
  });
});

test("POST /api/payments returns validation errors as API responses", async () => {
  await withServer(createApp(), async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        amount: -1
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "amount must be a positive integer in the smallest currency unit"
    });
  });
});

test(
  "POST /api/payments can create a live Stripe PaymentIntent when explicitly enabled",
  {
    skip:
      process.env.STRIPE_PAYMENT_SMOKE === "true" &&
      env.stripeSecretKey.startsWith("sk_test_")
        ? false
        : "Set STRIPE_PAYMENT_SMOKE=true and STRIPE_SECRET_KEY=sk_test_... to run the live smoke test"
  },
  async () => {
    clearStripeClientForTests();

    await withServer(createApp(), async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/payments`, {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          amount: 100,
          currency: "usd",
          metadata: {
            smoke: true
          }
        })
      });
      const payload = await response.json();

      assert.equal(response.status, 201);
      assert.equal(payload.success, true);
      assert.match(payload.data.paymentId, /^pi_/);
      assert.match(payload.data.clientSecret, /^pi_.*_secret_/);
    });
  }
);
