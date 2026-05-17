import test from "node:test";
import assert from "node:assert/strict";

// ─── Unit Tests (mocked Stripe SDK) ───

test("createPaymentIntent validation - missing amount", async (t) => {
  const { createPaymentIntent } = await import("../services/paymentService.js");

  await assert.rejects(
    () => createPaymentIntent({}),
    (error) => {
      assert.equal(error.name, "ValidationError");
      assert.match(error.message, /Missing required field: amount/);
      return true;
    }
  );
});

test("createPaymentIntent validation - amount must be positive integer", async (t) => {
  const { createPaymentIntent } = await import("../services/paymentService.js");

  await assert.rejects(
    () => createPaymentIntent({ amount: -100 }),
    (error) => {
      assert.equal(error.name, "ValidationError");
      assert.match(error.message, /positive integer/);
      return true;
    }
  );

  await assert.rejects(
    () => createPaymentIntent({ amount: 99.99 }),
    (error) => {
      assert.equal(error.name, "ValidationError");
      assert.match(error.message, /positive integer/);
      return true;
    }
  );

  await assert.rejects(
    () => createPaymentIntent({ amount: 0 }),
    (error) => {
      assert.equal(error.name, "ValidationError");
      assert.match(error.message, /positive integer/);
      return true;
    }
  );
});

test("createPaymentIntent validation - amount accepts valid positive integer", async (t) => {
  const { createPaymentIntent } = await import("../services/paymentService.js");

  await assert.rejects(
    () => createPaymentIntent({ amount: 1000, currency: "usd" }),
    (error) => {
      assert.equal(error.name, "ConfigurationError");
      return true;
    }
  );
});

test("createPaymentIntent defaults currency to usd", async (t) => {
  const { createPaymentIntent } = await import("../services/paymentService.js");

  await assert.rejects(
    () => createPaymentIntent({ amount: 1000 }),
    (error) => {
      assert.equal(error.name, "ConfigurationError");
      return true;
    }
  );
});

// ─── Controller Tests ───

test("POST /api/payments - returns 400 on missing amount", async (t) => {
  const { createApp } = await import("../app.js");
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
    body: JSON.stringify({}),
  });
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.equal(payload.success, false);
  assert.match(payload.message, /Missing required field: amount/);

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("POST /api/payments - returns 400 on invalid amount", async (t) => {
  const { createApp } = await import("../app.js");
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
    body: JSON.stringify({ amount: -50 }),
  });
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.equal(payload.success, false);

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

// ─── Integration Test (guarded by env flag) ───

test("Stripe integration - creates PaymentIntent in test mode", { skip: !process.env.RUN_STRIPE_INTEGRATION_TESTS }, async (t) => {
  const { createPaymentIntent } = await import("../services/paymentService.js");

  const result = await createPaymentIntent({
    amount: 1000,
    currency: "usd",
  });

  assert.ok(result.clientSecret, "clientSecret should be returned");
  assert.ok(result.paymentId, "paymentId should be returned");
  assert.match(result.paymentId, /^pi_/, "paymentId should start with pi_");
  assert.match(result.clientSecret, /^pi_.*_secret_/, "clientSecret should contain _secret_");
});
