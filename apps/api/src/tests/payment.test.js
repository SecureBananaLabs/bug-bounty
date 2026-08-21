import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import {
  resetStripeClientFactoryForTests,
  setStripeClientFactoryForTests
} from "../services/paymentService.js";

async function withServer(handler) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    return await handler(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test.afterEach(() => {
  resetStripeClientFactoryForTests();
  delete process.env.STRIPE_SECRET_KEY;
});

test("POST /api/payments creates a Stripe PaymentIntent", async () => {
  process.env.STRIPE_SECRET_KEY = "sk_test_mock";
  const createCalls = [];

  setStripeClientFactoryForTests((secretKey) => {
    assert.equal(secretKey, "sk_test_mock");

    return {
      paymentIntents: {
        async create(args) {
          createCalls.push(args);
          return {
            id: "pi_mock_123",
            client_secret: "pi_mock_123_secret_mock",
            amount: args.amount,
            currency: args.currency
          };
        }
      }
    };
  });

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        amount: 2500,
        currency: "USD",
        metadata: { jobId: "job_123", clientId: 42 }
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.deepEqual(createCalls, [
      {
        amount: 2500,
        currency: "usd",
        metadata: { jobId: "job_123", clientId: "42" }
      }
    ]);
    assert.deepEqual(payload, {
      success: true,
      data: {
        paymentId: "pi_mock_123",
        clientSecret: "pi_mock_123_secret_mock",
        amount: 2500,
        currency: "usd",
        provider: "stripe"
      }
    });
  });
});

test("POST /api/payments rejects invalid amounts before calling Stripe", async () => {
  process.env.STRIPE_SECRET_KEY = "sk_test_mock";
  let createCalled = false;

  setStripeClientFactoryForTests(() => ({
    paymentIntents: {
      async create() {
        createCalled = true;
      }
    }
  }));

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ amount: 0, currency: "usd" })
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.match(payload.message, /positive integer/);
    assert.equal(createCalled, false);
  });
});

test("POST /api/payments preserves Stripe error messages", async () => {
  process.env.STRIPE_SECRET_KEY = "sk_test_mock";

  setStripeClientFactoryForTests(() => ({
    paymentIntents: {
      async create() {
        const error = new Error("Your card was declined.");
        error.type = "StripeCardError";
        throw error;
      }
    }
  }));

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ amount: 2500 })
    });
    const payload = await response.json();

    assert.equal(response.status, 502);
    assert.deepEqual(payload, {
      success: false,
      message: "Your card was declined."
    });
  });
});

test("POST /api/payments can create a real Stripe PaymentIntent when enabled", {
  skip:
    process.env.RUN_STRIPE_SMOKE_TEST === "true" && process.env.STRIPE_SECRET_KEY
      ? false
      : "Set RUN_STRIPE_SMOKE_TEST=true and STRIPE_SECRET_KEY to run the Stripe smoke test."
}, async () => {
  resetStripeClientFactoryForTests();

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        amount: 100,
        currency: "usd",
        metadata: { source: "api-smoke-test" }
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.match(payload.data.paymentId, /^pi_/);
    assert.match(payload.data.clientSecret, /^pi_.*_secret_/);
    assert.equal(payload.data.amount, 100);
    assert.equal(payload.data.currency, "usd");
  });
});
