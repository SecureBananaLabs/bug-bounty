process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "sk_test_123";

import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

test("createPaymentIntent throws for missing payload", async () => {
  let threw = false;
  try {
    await createPaymentIntent();
  } catch (error) {
    threw = true;
    assert.equal(error.statusCode, 400);
    assert.ok(error.message.includes("amount is required"));
  } finally {
    assert.ok(threw, "Expected error for missing payload");
  }
});

test("createPaymentIntent throws for invalid amount", async () => {
  for (const amount of [undefined, null, 0, -1, 9.99, "100"]) {
    let threw = false;
    try {
      await createPaymentIntent({ amount });
    } catch (error) {
      threw = true;
      assert.equal(error.statusCode, 400);
      assert.ok(error.message.includes("amount is required"));
    } finally {
      assert.ok(threw, `Expected failure for amount=${amount}`);
    }
  }
});

test("createPaymentIntent creates a PaymentIntent with provided amount and currency", async () => {
  const paymentIntent = {
    id: "pi_123",
    client_secret: "pi_123_secret_456"
  };
  const stripeClient = {
    paymentIntents: {
      create: async (params) => {
        assert.deepEqual(params, { amount: 500, currency: "usd" });
        return paymentIntent;
      }
    }
  };

  const result = await createPaymentIntent(
    { amount: 500, currency: "usd" },
    { stripeClient }
  );

  assert.deepEqual(result, {
    paymentId: "pi_123",
    clientSecret: "pi_123_secret_456"
  });
});

test("createPaymentIntent defaults currency to usd when omitted", async () => {
  let captured;
  const stripeClient = {
    paymentIntents: {
      create: async (params) => {
        captured = params;
        return { id: "pi_456", client_secret: "secret_456" };
      }
    }
  };

  await createPaymentIntent({ amount: 1000 }, { stripeClient });

  assert.deepEqual(captured, { amount: 1000, currency: "usd" });
});

test("createPaymentIntent surfaces Stripe error message", async () => {
  const stripeClient = {
    paymentIntents: {
      create: async () => {
        const error = new Error("Stripe declined the payment.");
        error.statusCode = 402;
        throw error;
      }
    }
  };

  try {
    await createPaymentIntent({ amount: 500 }, { stripeClient });
    assert.fail("Expected error");
  } catch (error) {
    assert.equal(error.statusCode, 402);
    assert.equal(error.message, "Stripe declined the payment.");
  }
});
