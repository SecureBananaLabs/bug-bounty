import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import {
  createPaymentIntent,
  PaymentProviderError,
  PaymentValidationError
} from "../services/paymentService.js";

function createMockStripeClient(createPaymentIntentMock) {
  return {
    paymentIntents: {
      create: createPaymentIntentMock
    }
  };
}

async function withServer(app, callback) {
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    return await callback(server.address().port);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("createPaymentIntent validates and forwards Stripe PaymentIntent arguments", async () => {
  const calls = [];
  const stripeClient = createMockStripeClient(async (args) => {
    calls.push(args);
    return {
      id: "pi_123",
      client_secret: "pi_123_secret_test",
      amount: args.amount,
      currency: args.currency
    };
  });

  const result = await createPaymentIntent(
    {
      amount: 2500,
      currency: "USD",
      metadata: {
        jobId: "job_123",
        retry: false,
        attempt: 1
      }
    },
    { stripeClient }
  );

  assert.deepEqual(calls, [
    {
      amount: 2500,
      currency: "usd",
      metadata: {
        jobId: "job_123",
        retry: "false",
        attempt: "1"
      }
    }
  ]);
  assert.deepEqual(result, {
    paymentId: "pi_123",
    clientSecret: "pi_123_secret_test",
    amount: 2500,
    currency: "usd",
    provider: "stripe"
  });
});

test("createPaymentIntent defaults currency to usd", async () => {
  const calls = [];
  const stripeClient = createMockStripeClient(async (args) => {
    calls.push(args);
    return {
      id: "pi_default",
      client_secret: "pi_default_secret",
      amount: args.amount,
      currency: args.currency
    };
  });

  await createPaymentIntent({ amount: 499 }, { stripeClient });

  assert.deepEqual(calls, [
    {
      amount: 499,
      currency: "usd"
    }
  ]);
});

test("createPaymentIntent rejects invalid amount, currency, and metadata before Stripe call", async () => {
  const stripeClient = createMockStripeClient(() => {
    throw new Error("Stripe should not be called for invalid payloads");
  });

  await assert.rejects(
    createPaymentIntent({ currency: "usd" }, { stripeClient }),
    new PaymentValidationError("payload.amount is required and must be a positive integer")
  );
  await assert.rejects(
    createPaymentIntent({ amount: 10.5 }, { stripeClient }),
    new PaymentValidationError("payload.amount is required and must be a positive integer")
  );
  await assert.rejects(
    createPaymentIntent({ amount: 100, currency: "usdollars" }, { stripeClient }),
    new PaymentValidationError("payload.currency must be a 3-letter currency code")
  );
  await assert.rejects(
    createPaymentIntent({ amount: 100, metadata: { nested: { id: "job_123" } } }, { stripeClient }),
    new PaymentValidationError("payload.metadata values must be strings, numbers, or booleans")
  );
});

test("createPaymentIntent preserves Stripe error messages", async () => {
  const stripeError = new Error("Your card was declined.");
  stripeError.type = "StripeCardError";
  const stripeClient = createMockStripeClient(async () => {
    throw stripeError;
  });

  await assert.rejects(
    createPaymentIntent({ amount: 1000 }, { stripeClient }),
    (error) =>
      error instanceof PaymentProviderError &&
      error.message === "Your card was declined." &&
      error.cause === stripeError
  );
});

test("POST /api/payments returns validation errors as API responses", async () => {
  await withServer(createApp(), async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/payments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ currency: "usd" })
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "payload.amount is required and must be a positive integer"
    });
  });
});

test(
  "createPaymentIntent can create a live Stripe test-mode PaymentIntent",
  {
    skip:
      process.env.STRIPE_PAYMENT_SMOKE === "true"
        ? false
        : "Set STRIPE_PAYMENT_SMOKE=true and STRIPE_SECRET_KEY=sk_test_... to run"
  },
  async () => {
    assert.match(
      process.env.STRIPE_SECRET_KEY ?? "",
      /^sk_test_/,
      "Live smoke test must use a Stripe test-mode secret key"
    );

    const result = await createPaymentIntent({
      amount: 100,
      currency: "usd",
      metadata: {
        source: "api-payment-service-smoke"
      }
    });

    assert.match(result.paymentId, /^pi_/);
    assert.match(result.clientSecret, /^pi_.*_secret_/);
    assert.equal(result.amount, 100);
    assert.equal(result.currency, "usd");
    assert.equal(result.provider, "stripe");
  }
);
