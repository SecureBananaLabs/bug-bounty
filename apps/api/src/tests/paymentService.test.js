import test from "node:test";
import assert from "node:assert/strict";
import {
  createPaymentIntent,
  resetStripeClientForTests,
  setStripeClientForTests,
  smokeTestPaymentIntent
} from "../services/paymentService.js";

test.afterEach(() => {
  resetStripeClientForTests();
});

test("createPaymentIntent validates amount", async () => {
  await assert.rejects(
    () => createPaymentIntent({ currency: "usd" }),
    /amount is required/
  );
  await assert.rejects(
    () => createPaymentIntent({ amount: 10.5, currency: "usd" }),
    /positive integer/
  );
  await assert.rejects(
    () => createPaymentIntent({ amount: 0, currency: "usd" }),
    /positive integer/
  );
});

test("createPaymentIntent validates currency and metadata", async () => {
  await assert.rejects(
    () => createPaymentIntent({ amount: 100, currency: "usdollar" }),
    /currency must be/
  );
  await assert.rejects(
    () => createPaymentIntent({ amount: 100, metadata: ["bad"] }),
    /metadata must be an object/
  );
  await assert.rejects(
    () => createPaymentIntent({ amount: 100, metadata: { nested: { bad: true } } }),
    /metadata values/
  );
});

test("createPaymentIntent creates a Stripe PaymentIntent with validated fields", async () => {
  let receivedArgs;
  setStripeClientForTests({
    paymentIntents: {
      async create(args) {
        receivedArgs = args;
        return {
          id: "pi_test_123",
          client_secret: "pi_test_123_secret_abc",
          amount: args.amount,
          currency: args.currency
        };
      }
    }
  });

  const result = await createPaymentIntent({
    amount: 2500,
    currency: "USD",
    metadata: { orderId: 123, expedited: true }
  });

  assert.deepEqual(receivedArgs, {
    amount: 2500,
    currency: "usd",
    metadata: { orderId: "123", expedited: "true" }
  });
  assert.deepEqual(result, {
    paymentId: "pi_test_123",
    clientSecret: "pi_test_123_secret_abc",
    amount: 2500,
    currency: "usd",
    provider: "stripe"
  });
});

test("createPaymentIntent preserves Stripe error messages", async () => {
  setStripeClientForTests({
    paymentIntents: {
      async create() {
        const error = new Error("Your card was declined.");
        error.type = "StripeCardError";
        throw error;
      }
    }
  });

  await assert.rejects(
    () => createPaymentIntent({ amount: 100, currency: "usd" }),
    /Your card was declined\./
  );
});

test("smokeTestPaymentIntent is skipped unless explicitly enabled", async () => {
  const previous = process.env.STRIPE_PAYMENT_SMOKE_TEST;
  delete process.env.STRIPE_PAYMENT_SMOKE_TEST;

  try {
    assert.deepEqual(await smokeTestPaymentIntent(), {
      skipped: true,
      reason: "STRIPE_PAYMENT_SMOKE_TEST is not true"
    });
  } finally {
    if (previous === undefined) {
      delete process.env.STRIPE_PAYMENT_SMOKE_TEST;
    } else {
      process.env.STRIPE_PAYMENT_SMOKE_TEST = previous;
    }
  }
});

test("smokeTestPaymentIntent can create a real Stripe test PaymentIntent when enabled", async (t) => {
  if (process.env.STRIPE_PAYMENT_SMOKE_TEST !== "true" || !process.env.STRIPE_SECRET_KEY) {
    t.skip("Set STRIPE_PAYMENT_SMOKE_TEST=true and STRIPE_SECRET_KEY to run the Stripe smoke test");
    return;
  }

  const result = await smokeTestPaymentIntent();

  assert.equal(result.skipped, false);
  assert.match(result.paymentIntent.paymentId, /^pi_/);
  assert.match(result.paymentIntent.clientSecret, /_secret_/);
});
