import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { _setStripe, _resetStripe } from "../services/paymentService.js";

function createMockStripe(createFn) {
  return { paymentIntents: { create: createFn } };
}

async function withServer(fn) {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  try {
    await fn(server);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/payments - valid request returns 201 with payment data", async () => {
  process.env.STRIPE_SECRET_KEY = "sk_test_fake_key";
  _setStripe(createMockStripe(async () => ({
    id: "pi_1234567890",
    client_secret: "cs_test_secret",
    amount: 2000,
    currency: "usd",
  })));

  try {
    await withServer(async (server) => {
      const { port } = server.address();
      const response = await fetch(`http://127.0.0.1:${port}/api/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 2000, currency: "usd" }),
      });
      const payload = await response.json();

      assert.equal(response.status, 201);
      assert.equal(payload.success, true);
      assert.equal(payload.data.paymentId, "pi_1234567890");
      assert.equal(payload.data.clientSecret, "cs_test_secret");
      assert.equal(payload.data.amount, 2000);
      assert.equal(payload.data.currency, "usd");
      assert.equal(payload.data.provider, "stripe");
    });
  } finally {
    _resetStripe();
  }
});

test("POST /api/payments - default currency is usd", async () => {
  process.env.STRIPE_SECRET_KEY = "sk_test_fake_key";
  let capturedArgs;
  _setStripe(createMockStripe(async (args) => {
    capturedArgs = args;
    return { id: "pi_default", client_secret: "cs_test", amount: 1000, currency: "usd" };
  }));

  try {
    await withServer(async (server) => {
      const { port } = server.address();
      const response = await fetch(`http://127.0.0.1:${port}/api/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 1000 }),
      });
      await response.json();
      assert.equal(capturedArgs.currency, "usd");
    });
  } finally {
    _resetStripe();
  }
});

test("POST /api/payments - missing amount returns 400", async () => {
  process.env.STRIPE_SECRET_KEY = "sk_test_fake_key";
  _setStripe(createMockStripe(async () => ({})));

  try {
    await withServer(async (server) => {
      const { port } = server.address();
      const response = await fetch(`http://127.0.0.1:${port}/api/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const payload = await response.json();
      assert.equal(response.status, 400);
      assert.equal(payload.success, false);
      assert.ok(payload.message.includes("positive integer"));
    });
  } finally {
    _resetStripe();
  }
});

test("POST /api/payments - negative amount returns 400", async () => {
  process.env.STRIPE_SECRET_KEY = "sk_test_fake_key";
  _setStripe(createMockStripe(async () => ({})));

  try {
    await withServer(async (server) => {
      const { port } = server.address();
      const response = await fetch(`http://127.0.0.1:${port}/api/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: -500 }),
      });
      const payload = await response.json();
      assert.equal(response.status, 400);
      assert.equal(payload.success, false);
    });
  } finally {
    _resetStripe();
  }
});

test("POST /api/payments - non-integer amount returns 400", async () => {
  process.env.STRIPE_SECRET_KEY = "sk_test_fake_key";
  _setStripe(createMockStripe(async () => ({})));

  try {
    await withServer(async (server) => {
      const { port } = server.address();
      const response = await fetch(`http://127.0.0.1:${port}/api/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 10.5 }),
      });
      const payload = await response.json();
      assert.equal(response.status, 400);
      assert.equal(payload.success, false);
    });
  } finally {
    _resetStripe();
  }
});

test("POST /api/payments - StripeInvalidRequestError returns 400", async () => {
  process.env.STRIPE_SECRET_KEY = "sk_test_fake_key";
  const err = new Error("Invalid currency");
  err.type = "StripeInvalidRequestError";
  _setStripe(createMockStripe(async () => { throw err; }));

  try {
    await withServer(async (server) => {
      const { port } = server.address();
      const response = await fetch(`http://127.0.0.1:${port}/api/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 2000, currency: "invalid" }),
      });
      const payload = await response.json();
      assert.equal(response.status, 400);
      assert.ok(payload.message.includes("Invalid request"));
    });
  } finally {
    _resetStripe();
  }
});

test("POST /api/payments - StripeCardError returns 402", async () => {
  process.env.STRIPE_SECRET_KEY = "sk_test_fake_key";
  const err = new Error("Your card was declined");
  err.type = "StripeCardError";
  _setStripe(createMockStripe(async () => { throw err; }));

  try {
    await withServer(async (server) => {
      const { port } = server.address();
      const response = await fetch(`http://127.0.0.1:${port}/api/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 2000 }),
      });
      const payload = await response.json();
      assert.equal(response.status, 402);
      assert.ok(payload.message.includes("Card error"));
    });
  } finally {
    _resetStripe();
  }
});

test("POST /api/payments - StripeAuthenticationError returns 401", async () => {
  process.env.STRIPE_SECRET_KEY = "sk_test_fake_key";
  const err = new Error("Invalid API key");
  err.type = "StripeAuthenticationError";
  _setStripe(createMockStripe(async () => { throw err; }));

  try {
    await withServer(async (server) => {
      const { port } = server.address();
      const response = await fetch(`http://127.0.0.1:${port}/api/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 2000 }),
      });
      const payload = await response.json();
      assert.equal(response.status, 401);
      assert.ok(payload.message.includes("authentication failed"));
    });
  } finally {
    _resetStripe();
  }
});

test("POST /api/payments - StripeRateLimitError returns 429", async () => {
  process.env.STRIPE_SECRET_KEY = "sk_test_fake_key";
  const err = new Error("Too many requests");
  err.type = "StripeRateLimitError";
  _setStripe(createMockStripe(async () => { throw err; }));

  try {
    await withServer(async (server) => {
      const { port } = server.address();
      const response = await fetch(`http://127.0.0.1:${port}/api/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 2000 }),
      });
      const payload = await response.json();
      assert.equal(response.status, 429);
      assert.ok(payload.message.includes("Too many requests"));
    });
  } finally {
    _resetStripe();
  }
});

test("POST /api/payments - unknown Stripe error returns 500", async () => {
  process.env.STRIPE_SECRET_KEY = "sk_test_fake_key";
  const err = new Error("Internal Stripe failure");
  err.type = "StripeAPIError";
  _setStripe(createMockStripe(async () => { throw err; }));

  try {
    await withServer(async (server) => {
      const { port } = server.address();
      const response = await fetch(`http://127.0.0.1:${port}/api/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 2000 }),
      });
      const payload = await response.json();
      assert.equal(response.status, 500);
      assert.ok(payload.message.includes("Payment processing failed"));
    });
  } finally {
    _resetStripe();
  }
});
