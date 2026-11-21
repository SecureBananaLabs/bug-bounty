import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { createPaymentIntent } from "../services/paymentService.js";

test("createPaymentIntent creates a Stripe PaymentIntent and maps response fields", async () => {
  const calls = [];
  const stripeClient = {
    paymentIntents: {
      async create(input) {
        calls.push(input);
        return {
          id: "pi_test_123",
          client_secret: "pi_test_123_secret_456"
        };
      }
    }
  };

  const result = await createPaymentIntent(
    {
      amount: 1250,
      currency: "eur",
      metadata: { jobId: "job_123" }
    },
    { stripeClient }
  );

  assert.deepEqual(calls, [
    {
      amount: 1250,
      currency: "eur",
      metadata: { jobId: "job_123" }
    }
  ]);
  assert.deepEqual(result, {
    paymentId: "pi_test_123",
    clientSecret: "pi_test_123_secret_456",
    amount: 1250,
    currency: "eur",
    provider: "stripe"
  });
});

test("createPaymentIntent defaults currency to usd", async () => {
  const calls = [];
  const stripeClient = {
    paymentIntents: {
      async create(input) {
        calls.push(input);
        return { id: "pi_default", client_secret: "secret_default" };
      }
    }
  };

  await createPaymentIntent({ amount: 500 }, { stripeClient });

  assert.equal(calls[0].currency, "usd");
});

test("createPaymentIntent rejects invalid amount before calling Stripe", async () => {
  const stripeClient = {
    paymentIntents: {
      async create() {
        throw new Error("Stripe should not be called");
      }
    }
  };

  await assert.rejects(
    () => createPaymentIntent({ amount: 0 }, { stripeClient }),
    /amount must be a positive integer/
  );
});

test("createPaymentIntent preserves Stripe error messages", async () => {
  const stripeClient = {
    paymentIntents: {
      async create() {
        const error = new Error("Your card was declined");
        error.type = "StripeCardError";
        throw error;
      }
    }
  };

  await assert.rejects(
    () => createPaymentIntent({ amount: 100 }, { stripeClient }),
    /Your card was declined/
  );
});

test("createPaymentIntent smoke test can create a test-mode PaymentIntent", { skip: !process.env.STRIPE_PAYMENT_SMOKE }, async () => {
  const result = await createPaymentIntent({ amount: 100, currency: "usd" });

  assert.match(result.paymentId, /^pi_/);
  assert.ok(result.clientSecret);
});

test("POST /api/payments returns payment validation errors", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 500);

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/payments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ amount: 0 }),
      signal: controller.signal
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "amount must be a positive integer in the smallest currency unit"
    });
  } finally {
    clearTimeout(timeout);
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
