import test from "node:test";
import assert from "node:assert/strict";
import {
  createPaymentIntent,
  resetStripeClientForTests,
  setStripeClientForTests
} from "../services/paymentService.js";

test.afterEach(() => {
  resetStripeClientForTests();
});

test("createPaymentIntent validates amount before calling Stripe", async () => {
  let called = false;
  setStripeClientForTests({
    paymentIntents: {
      create: async () => {
        called = true;
      }
    }
  });

  await assert.rejects(
    () => createPaymentIntent({ currency: "usd" }),
    /payload.amount is required/
  );
  await assert.rejects(
    () => createPaymentIntent({ amount: 12.5, currency: "usd" }),
    /positive integer/
  );
  assert.equal(called, false);
});

test("createPaymentIntent defaults currency and maps Stripe response", async () => {
  let receivedArgs;
  setStripeClientForTests({
    paymentIntents: {
      create: async (args) => {
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

  const result = await createPaymentIntent({ amount: 2500 });

  assert.deepEqual(receivedArgs, { amount: 2500, currency: "usd" });
  assert.deepEqual(result, {
    paymentId: "pi_test_123",
    clientSecret: "pi_test_123_secret_abc",
    amount: 2500,
    currency: "usd",
    provider: "stripe"
  });
});

test("createPaymentIntent passes normalized metadata to Stripe", async () => {
  let receivedArgs;
  setStripeClientForTests({
    paymentIntents: {
      create: async (args) => {
        receivedArgs = args;
        return {
          id: "pi_meta",
          client_secret: "secret_meta",
          amount: args.amount,
          currency: args.currency
        };
      }
    }
  });

  await createPaymentIntent({
    amount: 9900,
    currency: "EUR",
    metadata: {
      jobId: "job_101",
      milestone: 2,
      escrow: true
    }
  });

  assert.deepEqual(receivedArgs, {
    amount: 9900,
    currency: "eur",
    metadata: {
      jobId: "job_101",
      milestone: "2",
      escrow: "true"
    }
  });
});

test("createPaymentIntent preserves Stripe API error messages", async () => {
  setStripeClientForTests({
    paymentIntents: {
      create: async () => {
        const error = new Error("Your card was declined.");
        error.type = "StripeCardError";
        throw error;
      }
    }
  });

  await assert.rejects(
    () => createPaymentIntent({ amount: 500, currency: "usd" }),
    /Your card was declined/
  );
});

test("guarded Stripe smoke test creates a test-mode PaymentIntent only when explicitly enabled", async (t) => {
  if (process.env.RUN_STRIPE_SMOKE !== "1" || !process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_")) {
    t.skip("Set RUN_STRIPE_SMOKE=1 with a Stripe test secret key to run the live smoke test");
    return;
  }

  resetStripeClientForTests();
  const result = await createPaymentIntent({
    amount: 100,
    currency: "usd",
    metadata: { smoke: true }
  });

  assert.match(result.paymentId, /^pi_/);
  assert.match(result.clientSecret, /^pi_.*_secret_/);
});
