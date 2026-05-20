import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { createPaymentIntent } from "../services/paymentService.js";

function createMockStripeClient(response, calls = []) {
  return {
    paymentIntents: {
      async create(params) {
        calls.push(params);
        if (response instanceof Error) {
          throw response;
        }
        return response;
      }
    }
  };
}

test("createPaymentIntent creates a Stripe PaymentIntent with validated arguments", async () => {
  const calls = [];
  const stripeClient = createMockStripeClient(
    {
      id: "pi_123",
      client_secret: "pi_123_secret_abc",
      amount: 2500,
      currency: "usd"
    },
    calls
  );

  const result = await createPaymentIntent(
    {
      amount: 2500,
      currency: "USD",
      metadata: { orderId: 42, recurring: false }
    },
    stripeClient
  );

  assert.deepEqual(calls, [
    {
      amount: 2500,
      currency: "usd",
      metadata: { orderId: "42", recurring: "false" }
    }
  ]);
  assert.deepEqual(result, {
    paymentId: "pi_123",
    clientSecret: "pi_123_secret_abc",
    amount: 2500,
    currency: "usd",
    provider: "stripe"
  });
});

test("createPaymentIntent defaults currency to usd", async () => {
  const calls = [];
  const stripeClient = createMockStripeClient(
    {
      id: "pi_default",
      client_secret: "pi_default_secret",
      amount: 500,
      currency: "usd"
    },
    calls
  );

  await createPaymentIntent({ amount: 500 }, stripeClient);

  assert.deepEqual(calls, [{ amount: 500, currency: "usd" }]);
});

test("createPaymentIntent rejects invalid amounts before calling Stripe", async () => {
  const calls = [];
  const stripeClient = createMockStripeClient({}, calls);

  await assert.rejects(
    () => createPaymentIntent({ amount: 0 }, stripeClient),
    /positive integer/
  );
  await assert.rejects(
    () => createPaymentIntent({ amount: 10.5 }, stripeClient),
    /positive integer/
  );
  await assert.rejects(
    () => createPaymentIntent({}, stripeClient),
    /amount is required/
  );

  assert.deepEqual(calls, []);
});

test("createPaymentIntent preserves Stripe error messages", async () => {
  const stripeError = new Error("Your card was declined");
  stripeError.type = "StripeCardError";
  const stripeClient = createMockStripeClient(stripeError);

  await assert.rejects(
    () => createPaymentIntent({ amount: 2000, currency: "usd" }, stripeClient),
    (error) => {
      assert.equal(error.message, "Your card was declined");
      assert.equal(error.statusCode, 502);
      assert.equal(error.expose, true);
      assert.equal(error.cause, stripeError);
      return true;
    }
  );
});

test("POST /api/payments surfaces missing Stripe configuration", async () => {
  const previousSecret = process.env.STRIPE_SECRET_KEY;
  delete process.env.STRIPE_SECRET_KEY;

  const app = createApp();
  const server = app.listen(0);

  try {
    await new Promise((resolve, reject) => {
      server.once("listening", resolve);
      server.once("error", reject);
    });

    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/payments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ amount: 1000 })
    });
    const payload = await response.json();

    assert.equal(response.status, 503);
    assert.deepEqual(payload, {
      success: false,
      message: "STRIPE_SECRET_KEY environment variable is required"
    });
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    if (previousSecret === undefined) {
      delete process.env.STRIPE_SECRET_KEY;
    } else {
      process.env.STRIPE_SECRET_KEY = previousSecret;
    }
  }
});

const canRunStripeSmokeTest =
  process.env.RUN_STRIPE_SMOKE === "1" &&
  process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_");

test(
  "smoke: creates a live Stripe test-mode PaymentIntent",
  {
    skip:
      !canRunStripeSmokeTest &&
      "Set RUN_STRIPE_SMOKE=1 and STRIPE_SECRET_KEY=sk_test_... to run"
  },
  async () => {
    const result = await createPaymentIntent({
      amount: 100,
      currency: "usd",
      metadata: { source: "api-smoke-test" }
    });

    assert.match(result.paymentId, /^pi_/);
    assert.match(result.clientSecret, /^pi_/);
    assert.equal(result.amount, 100);
    assert.equal(result.currency, "usd");
    assert.equal(result.provider, "stripe");
  }
);
