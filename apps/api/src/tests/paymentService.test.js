import test from "node:test";
import assert from "node:assert/strict";

import {
  createPaymentIntent,
  __setStripeInstance,
} from "../services/paymentService.js";

// ============================================================
// Mock Stripe
// ============================================================

const mockPaymentIntents = { create: null };

function createMockStripe() {
  return {
    paymentIntents: {
      create: (opts) => {
        if (!mockPaymentIntents.create) {
          return Promise.reject(new Error("mock not configured"));
        }
        return mockPaymentIntents.create(opts);
      },
    },
  };
}

// Stripe 错误 mock 类
function makeStripeError(message, type, statusCode) {
  const err = new Error(message);
  err.type = type;
  err.statusCode = statusCode;
  return err;
}

// ============================================================
// 测试
// ============================================================

test("createPaymentIntent calls stripe.paymentIntents.create with correct args", async () => {
  __setStripeInstance(createMockStripe());

  mockPaymentIntents.create = async (opts) => ({
    id: "pi_mock_123",
    client_secret: "pi_mock_123_secret_abc",
    amount: opts.amount,
    currency: opts.currency,
  });

  const result = await createPaymentIntent({ amount: 2000, currency: "usd" });

  assert.equal(result.paymentId, "pi_mock_123");
  assert.equal(result.clientSecret, "pi_mock_123_secret_abc");
  assert.equal(result.amount, 2000);
  assert.equal(result.currency, "usd");
});

test("createPaymentIntent defaults currency to usd", async () => {
  __setStripeInstance(createMockStripe());

  mockPaymentIntents.create = async (opts) => ({
    id: "pi_mock_2",
    client_secret: "secret_2",
    amount: opts.amount,
    currency: opts.currency,
  });

  const result = await createPaymentIntent({ amount: 1000 });
  assert.equal(result.currency, "usd");
});

test("createPaymentIntent throws when amount is missing", async () => {
  __setStripeInstance(createMockStripe());
  await assert.rejects(() => createPaymentIntent({}), {
    message: "amount is required and must be a positive integer",
  });
});

test("createPaymentIntent throws when amount is not positive", async () => {
  __setStripeInstance(createMockStripe());
  await assert.rejects(() => createPaymentIntent({ amount: -5 }), {
    message: /positive integer/,
  });
});

test("createPaymentIntent throws when amount is zero", async () => {
  __setStripeInstance(createMockStripe());
  await assert.rejects(() => createPaymentIntent({ amount: 0 }), {
    message: /positive integer/,
  });
});

test("createPaymentIntent handles invalid_request_error", async () => {
  __setStripeInstance(createMockStripe());
  mockPaymentIntents.create = async () => {
    throw makeStripeError("Invalid currency 'xyz'", "invalid_request_error", 400);
  };

  await assert.rejects(() => createPaymentIntent({ amount: 1000, currency: "xyz" }), {
    message: /Invalid request/,
  });
});

test("createPaymentIntent handles card_error", async () => {
  __setStripeInstance(createMockStripe());
  mockPaymentIntents.create = async () => {
    throw makeStripeError("Your card was declined.", "card_error", 402);
  };

  await assert.rejects(() => createPaymentIntent({ amount: 1000 }), {
    message: /Card error/,
  });
});

test("createPaymentIntent handles authentication_error", async () => {
  __setStripeInstance(createMockStripe());
  mockPaymentIntents.create = async () => {
    throw makeStripeError("Bad key", "authentication_error", 401);
  };

  await assert.rejects(() => createPaymentIntent({ amount: 1000 }), {
    message: /Authentication failed/,
  });
});

test("createPaymentIntent handles rate_limit_error", async () => {
  __setStripeInstance(createMockStripe());
  mockPaymentIntents.create = async () => {
    throw makeStripeError("Too fast", "rate_limit_error", 429);
  };

  await assert.rejects(() => createPaymentIntent({ amount: 1000 }), {
    message: /Too many requests/,
  });
});

test("createPaymentIntent passes metadata to Stripe", async () => {
  __setStripeInstance(createMockStripe());
  let captured;
  mockPaymentIntents.create = async (opts) => {
    captured = opts;
    return { id: "pi_m", client_secret: "s", amount: 500, currency: "usd" };
  };

  await createPaymentIntent({ amount: 500, metadata: { orderId: "ord_1" } });
  assert.equal(captured.metadata.orderId, "ord_1");
});
