import test, { afterEach } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { env } from "../config/env.js";
import {
  createPaymentIntent,
  resetStripeClientForTests,
  setStripeClientForTests
} from "../services/paymentService.js";

function createStripeMock(handler) {
  return {
    paymentIntents: {
      create: handler
    }
  };
}

afterEach(() => {
  resetStripeClientForTests();
});

async function withApiServer(callback) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  try {
    return await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("createPaymentIntent validates and maps a Stripe PaymentIntent", async () => {
  const calls = [];

  setStripeClientForTests(
    createStripeMock(async (payload) => {
      calls.push(payload);
      return {
        id: "pi_test_123",
        client_secret: "pi_test_123_secret_abc",
        amount: payload.amount,
        currency: payload.currency
      };
    })
  );

  const result = await createPaymentIntent({
    amount: 2500,
    metadata: {
      jobId: "job_123",
      retry: false,
      attempt: 2
    }
  });

  assert.deepEqual(calls, [
    {
      amount: 2500,
      currency: "usd",
      metadata: {
        jobId: "job_123",
        retry: "false",
        attempt: "2"
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

  resetStripeClientForTests();
});

test("createPaymentIntent normalizes explicit currency before the Stripe call", async () => {
  let stripePayload;

  setStripeClientForTests(
    createStripeMock(async (payload) => {
      stripePayload = payload;
      return {
        id: "pi_test_eur",
        client_secret: "secret",
        amount: payload.amount,
        currency: payload.currency
      };
    })
  );

  await createPaymentIntent({ amount: 900, currency: "EUR" });

  assert.equal(stripePayload.currency, "eur");
  resetStripeClientForTests();
});

test("createPaymentIntent rejects invalid amount before calling Stripe", async () => {
  let called = false;

  setStripeClientForTests(
    createStripeMock(async () => {
      called = true;
      throw new Error("should not be called");
    })
  );

  await assert.rejects(
    createPaymentIntent({ amount: 0 }),
    /payload.amount must be a positive integer/
  );
  assert.equal(called, false);

  resetStripeClientForTests();
});

test("createPaymentIntent rejects invalid currency before calling Stripe", async () => {
  let called = false;

  setStripeClientForTests(
    createStripeMock(async () => {
      called = true;
      throw new Error("should not be called");
    })
  );

  await assert.rejects(
    createPaymentIntent({ amount: 1000, currency: "usdollars" }),
    /payload.currency must be a three-letter ISO currency code/
  );
  assert.equal(called, false);

  resetStripeClientForTests();
});

test("createPaymentIntent rejects invalid metadata before calling Stripe", async () => {
  let called = false;

  setStripeClientForTests(
    createStripeMock(async () => {
      called = true;
      throw new Error("should not be called");
    })
  );

  await assert.rejects(
    createPaymentIntent({
      amount: 1000,
      metadata: {
        nested: { bad: true }
      }
    }),
    /payload.metadata.nested must be a string, number, or boolean/
  );
  assert.equal(called, false);

  resetStripeClientForTests();
});

test("createPaymentIntent preserves Stripe error messages", async () => {
  setStripeClientForTests(
    createStripeMock(async () => {
      const error = new Error("Your card was declined.");
      error.type = "StripeCardError";
      throw error;
    })
  );

  await assert.rejects(
    createPaymentIntent({ amount: 1000, currency: "usd" }),
    /Your card was declined./
  );

  resetStripeClientForTests();
});

test("POST /api/payments returns mapped Stripe PaymentIntent data", async () => {
  setStripeClientForTests(
    createStripeMock(async (payload) => ({
      id: "pi_route_123",
      client_secret: "pi_route_123_secret_abc",
      amount: payload.amount,
      currency: payload.currency
    }))
  );

  await withApiServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ amount: 1200, currency: "usd" })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.deepEqual(payload, {
      success: true,
      data: {
        paymentId: "pi_route_123",
        clientSecret: "pi_route_123_secret_abc",
        amount: 1200,
        currency: "usd",
        provider: "stripe"
      }
    });
  });

  resetStripeClientForTests();
});

test("POST /api/payments returns validation errors before calling Stripe", async () => {
  let called = false;

  setStripeClientForTests(
    createStripeMock(async () => {
      called = true;
      throw new Error("should not be called");
    })
  );

  await withApiServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ amount: -1 })
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "payload.amount must be a positive integer in the smallest currency unit"
    });
  });

  assert.equal(called, false);
  resetStripeClientForTests();
});

test("createPaymentIntent requires STRIPE_SECRET_KEY when no client is injected", async () => {
  const originalStripeSecretKey = env.stripeSecretKey;

  resetStripeClientForTests();
  env.stripeSecretKey = "";

  try {
    await assert.rejects(
      createPaymentIntent({ amount: 1000, currency: "usd" }),
      /STRIPE_SECRET_KEY is required/
    );
  } finally {
    env.stripeSecretKey = originalStripeSecretKey;
  }
});

test(
  "createPaymentIntent can create a live Stripe test-mode PaymentIntent",
  { skip: process.env.RUN_STRIPE_SMOKE !== "1" || !process.env.STRIPE_SECRET_KEY },
  async () => {
    resetStripeClientForTests();

    const result = await createPaymentIntent({
      amount: 100,
      currency: "usd",
      metadata: {
        source: "freelanceflow-smoke-test"
      }
    });

    assert.match(result.paymentId, /^pi_/);
    assert.match(result.clientSecret, /_secret_/);
    assert.equal(result.amount, 100);
    assert.equal(result.currency, "usd");
    assert.equal(result.provider, "stripe");
  }
);
