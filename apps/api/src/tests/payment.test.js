import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

test("createPaymentIntent uses Stripe paymentIntents.create with normalized currency", async () => {
  const calls = [];
  const fakeStripe = {
    paymentIntents: {
      create: async (payload) => {
        calls.push(payload);
        return {
          id: "pi_test_123",
          client_secret: "secret_test_123"
        };
      }
    }
  };

  const result = await createPaymentIntent(
    {
      amount: 2500,
      currency: "eur"
    },
    fakeStripe
  );

  assert.deepEqual(calls, [{ amount: 2500, currency: "eur" }]);
  assert.deepEqual(result, {
    paymentId: "pi_test_123",
    clientSecret: "secret_test_123",
    amount: 2500,
    currency: "eur",
    provider: "stripe"
  });
});

test("createPaymentIntent forwards metadata to Stripe", async () => {
  const calls = [];
  const fakeStripe = {
    paymentIntents: {
      create: async (payload) => {
        calls.push(payload);
        return {
          id: "pi_test_meta",
          client_secret: "secret_test_meta"
        };
      }
    }
  };

  await createPaymentIntent(
    {
      amount: 750,
      currency: "usd",
      metadata: {
        orderId: "order_123",
        source: "dashboard"
      }
    },
    fakeStripe
  );

  assert.deepEqual(calls, [
    {
      amount: 750,
      currency: "usd",
      metadata: {
        orderId: "order_123",
        source: "dashboard"
      }
    }
  ]);
});

test("createPaymentIntent defaults currency to usd", async () => {
  const calls = [];
  const fakeStripe = {
    paymentIntents: {
      create: async (payload) => {
        calls.push(payload);
        return {
          id: "pi_test_456",
          client_secret: "secret_test_456"
        };
      }
    }
  };

  await createPaymentIntent({ amount: 1000 }, fakeStripe);

  assert.deepEqual(calls, [{ amount: 1000, currency: "usd" }]);
});

test("createPaymentIntent rejects invalid amounts", async () => {
  const fakeStripe = {
    paymentIntents: {
      create: async () => {
        throw new Error("should not be called");
      }
    }
  };

  await assert.rejects(
    () => createPaymentIntent({ amount: 0 }, fakeStripe),
    /payload\.amount must be a positive integer/
  );
});

test("createPaymentIntent rejects invalid metadata", async () => {
  const fakeStripe = {
    paymentIntents: {
      create: async () => {
        throw new Error("should not be called");
      }
    }
  };

  await assert.rejects(
    () => createPaymentIntent({ amount: 1000, metadata: { orderId: 123 } }, fakeStripe),
    /payload\.metadata\.orderId must be a string/
  );
});

test("createPaymentIntent preserves Stripe error messages", async () => {
  const fakeStripe = {
    paymentIntents: {
      create: async () => {
        throw new Error("Stripe says no");
      }
    }
  };

  await assert.rejects(
    () => createPaymentIntent({ amount: 1000 }, fakeStripe),
    /Stripe says no/
  );
});

test("integration smoke is gated by env flag", async (t) => {
  if (process.env.STRIPE_SMOKE_TEST !== "1") {
    t.skip("STRIPE_SMOKE_TEST is not enabled");
    return;
  }

  assert.ok(process.env.STRIPE_SECRET_KEY, "STRIPE_SECRET_KEY must be set for smoke test");

  const payment = await createPaymentIntent({
    amount: 100,
    currency: "usd",
    metadata: {
      source: "smoke-test"
    }
  });

  assert.equal(payment.provider, "stripe");
  assert.ok(payment.paymentId);
  assert.ok(payment.clientSecret);
});
