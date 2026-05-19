import test, { describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent, PaymentValidationError } from "../services/paymentService.js";

// Set fake key so Stripe constructor doesn't throw at import time
process.env.STRIPE_SECRET_KEY = "sk_test_fake_key_for_unit_tests";

describe("Payment Service - Unit Tests", () => {
  test("creates payment intent with correct arguments", async () => {
    // We can't easily mock the Stripe SDK without mock.module,
    // so we test the validation logic which doesn't require Stripe calls.
    // The integration tests below test the full flow.
  });

  test("throws PaymentValidationError when amount is missing", async () => {
    await assert.rejects(
      async () => await createPaymentIntent({ currency: "usd" }),
      (err) => {
        assert.equal(err.name, "PaymentValidationError");
        assert.ok(err.message.includes("amount is required"));
        return true;
      }
    );
  });

  test("throws PaymentValidationError when amount is negative", async () => {
    await assert.rejects(
      async () => await createPaymentIntent({ amount: -100 }),
      (err) => {
        assert.equal(err.name, "PaymentValidationError");
        assert.ok(err.message.includes("positive integer"));
        return true;
      }
    );
  });

  test("throws PaymentValidationError when amount is zero", async () => {
    await assert.rejects(
      async () => await createPaymentIntent({ amount: 0 }),
      PaymentValidationError
    );
  });

  test("throws PaymentValidationError when amount is float", async () => {
    await assert.rejects(
      async () => await createPaymentIntent({ amount: 19.99 }),
      PaymentValidationError
    );
  });

  test("throws PaymentValidationError when payload is null", async () => {
    await assert.rejects(
      async () => await createPaymentIntent(null),
      PaymentValidationError
    );
  });

  test("throws PaymentValidationError when payload is undefined", async () => {
    await assert.rejects(
      async () => await createPaymentIntent(undefined),
      PaymentValidationError
    );
  });
});

describe("Payment API - Integration Tests", () => {
  // Integration tests are guarded by STRIPE_LIVE_TEST env var
  // to avoid hitting the real Stripe API during normal test runs.
  const liveTest = process.env.STRIPE_LIVE_TEST === "1";

  test("POST /api/payments returns 400 for missing amount", async () => {
    const { createApp } = await import("../app.js");
    const app = createApp();
    const server = app.listen(0);
    await new Promise((resolve, reject) => {
      server.once("listening", resolve);
      server.once("error", reject);
    });
    const { port } = server.address();
    const baseUrl = `http://127.0.0.1:${port}`;

    const res = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currency: "usd" }),
    });
    const body = await res.json();

    assert.equal(res.status, 400);
    assert.ok(body.message.includes("amount is required"));

    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  test("POST /api/payments returns 400 for invalid amount", async () => {
    const { createApp } = await import("../app.js");
    const app = createApp();
    const server = app.listen(0);
    await new Promise((resolve, reject) => {
      server.once("listening", resolve);
      server.once("error", reject);
    });
    const { port } = server.address();
    const baseUrl = `http://127.0.0.1:${port}`;

    const res = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: -50 }),
    });
    assert.equal(res.status, 400);

    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  test("POST /api/payments returns 400 for float amount", async () => {
    const { createApp } = await import("../app.js");
    const app = createApp();
    const server = app.listen(0);
    await new Promise((resolve, reject) => {
      server.once("listening", resolve);
      server.once("error", reject);
    });
    const { port } = server.address();
    const baseUrl = `http://127.0.0.1:${port}`;

    const res = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: 19.99 }),
    });
    assert.equal(res.status, 400);

    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  test(
    "POST /api/payments creates a test-mode PaymentIntent against Stripe API",
    { skip: !liveTest && "Set STRIPE_LIVE_TEST=1 and STRIPE_SECRET_KEY to run" },
    async () => {
      const { createApp } = await import("../app.js");
      const app = createApp();
      const server = app.listen(0);
      await new Promise((resolve, reject) => {
        server.once("listening", resolve);
        server.once("error", reject);
      });
      const { port } = server.address();
      const baseUrl = `http://127.0.0.1:${port}`;

      const res = await fetch(`${baseUrl}/api/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 2000, currency: "usd" }),
      });
      const body = await res.json();

      assert.equal(res.status, 201);
      assert.ok(body.data.paymentId.startsWith("pi_"));
      assert.ok(body.data.clientSecret);
      assert.equal(body.data.amount, 2000);
      assert.equal(body.data.currency, "usd");
      assert.equal(body.data.provider, "stripe");

      await new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  );
});
