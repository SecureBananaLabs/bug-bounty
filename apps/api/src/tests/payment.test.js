import test from "node:test";
import assert from "node:assert/strict";
import { stripe, createPaymentIntent } from "../services/paymentService.js";
import { createApp } from "../app.js";

test("Payment Service Unit Tests", async (t) => {
  t.afterEach(() => {
    t.mock.restoreAll();
  });

  await t.test("should successfully create a payment intent with mocked Stripe SDK", async (t) => {
    const createMock = t.mock.method(stripe.paymentIntents, "create", async (params) => {
      assert.deepEqual(params, {
        amount: 2000,
        currency: "usd"
      });
      return {
        id: "pi_mock123",
        client_secret: "pi_mock123_secret_mock456",
        amount: 2000,
        currency: "usd"
      };
    });

    const result = await createPaymentIntent({ amount: 2000, currency: "usd" });
    assert.equal(createMock.mock.callCount(), 1);
    assert.deepEqual(result, {
      paymentId: "pi_mock123",
      clientSecret: "pi_mock123_secret_mock456",
      amount: 2000,
      currency: "usd",
      provider: "stripe"
    });
  });

  await t.test("should default currency to usd if not provided", async (t) => {
    const createMock = t.mock.method(stripe.paymentIntents, "create", async (params) => {
      assert.equal(params.currency, "usd");
      return {
        id: "pi_mock456",
        client_secret: "pi_mock456_secret_mock789",
        amount: 1500,
        currency: "usd"
      };
    });

    const result = await createPaymentIntent({ amount: 1500 });
    assert.equal(createMock.mock.callCount(), 1);
    assert.equal(result.currency, "usd");
  });

  await t.test("should validate amount is required", async () => {
    await assert.rejects(
      createPaymentIntent({}),
      /Amount is required/
    );
    await assert.rejects(
      createPaymentIntent(null),
      /Amount is required/
    );
  });

  await t.test("should validate amount must be a positive integer", async () => {
    await assert.rejects(
      createPaymentIntent({ amount: -500 }),
      /Amount must be a positive integer/
    );
    await assert.rejects(
      createPaymentIntent({ amount: 0 }),
      /Amount must be a positive integer/
    );
    await assert.rejects(
      createPaymentIntent({ amount: 15.5 }),
      /Amount must be a positive integer/
    );
    await assert.rejects(
      createPaymentIntent({ amount: "1000" }),
      /Amount must be a positive integer/
    );
  });

  await t.test("should catch Stripe error and preserve the original message", async (t) => {
    t.mock.method(stripe.paymentIntents, "create", async () => {
      const stripeError = new Error("Your card was declined.");
      stripeError.type = "StripeCardError";
      throw stripeError;
    });

    await assert.rejects(
      createPaymentIntent({ amount: 1000 }),
      /Your card was declined/
    );
  });
});

test("API payment endpoint test", async (t) => {
  t.afterEach(() => {
    t.mock.restoreAll();
  });

  await t.test("POST /api/payments returns ok on success", async (t) => {
    t.mock.method(stripe.paymentIntents, "create", async () => {
      return {
        id: "pi_api_test",
        client_secret: "pi_api_test_secret",
        amount: 2500,
        currency: "usd"
      };
    });

    const app = createApp();
    const server = app.listen(0);

    await new Promise((resolve, reject) => {
      server.once("listening", resolve);
      server.once("error", reject);
    });

    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: 2500, currency: "usd" })
    });

    const payload = await response.json();
    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.deepEqual(payload.data, {
      paymentId: "pi_api_test",
      clientSecret: "pi_api_test_secret",
      amount: 2500,
      currency: "usd",
      provider: "stripe"
    });

    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  await t.test("POST /api/payments returns 400 on validation failure", async () => {
    const app = createApp();
    const server = app.listen(0);

    await new Promise((resolve, reject) => {
      server.once("listening", resolve);
      server.once("error", reject);
    });

    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: -500 })
    });

    const payload = await response.json();
    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Amount must be a positive integer");

    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });
});

// Integration / Smoke Test (guarded by env flag STRIPE_INTEGRATION_TEST)
if (process.env.STRIPE_INTEGRATION_TEST) {
  test("Stripe Integration / Smoke Test", async () => {
    assert.ok(process.env.STRIPE_SECRET_KEY, "STRIPE_SECRET_KEY must be configured for integration test");
    console.log("Running Stripe API integration smoke test...");
    
    const result = await createPaymentIntent({ amount: 100, currency: "usd" });
    assert.ok(result.paymentId.startsWith("pi_"), "Payment ID should start with pi_");
    assert.ok(result.clientSecret.includes("_secret_"), "Client secret should contain _secret_");
    assert.equal(result.amount, 100);
    assert.equal(result.currency, "usd");
    console.log("Stripe API integration test PASSED! Generated paymentId:", result.paymentId);
  });
}
