import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent, initStripe } from "../services/paymentService.js";

test("createPaymentIntent throws when amount is missing", async () => {
  await assert.rejects(
    () => createPaymentIntent({}),
    /payload.amount is required/
  );
});

test("createPaymentIntent throws when amount is zero", async () => {
  await assert.rejects(
    () => createPaymentIntent({ amount: 0 }),
    /payload.amount is required/
  );
});

test("createPaymentIntent throws when amount is negative", async () => {
  await assert.rejects(
    () => createPaymentIntent({ amount: -100 }),
    /payload.amount is required/
  );
});

test("createPaymentIntent throws when amount is not a number", async () => {
  await assert.rejects(
    () => createPaymentIntent({ amount: "100" }),
    /payload.amount is required/
  );
});

test("createPaymentIntent returns correct shape and maps fields from PaymentIntent", async () => {
  const mockStripe = {
    paymentIntents: {
      create: async (args) => ({
        id: `pi_${Date.now()}`,
        client_secret: `pi_${Date.now()}_secret_${args.currency}`,
        amount: args.amount,
        currency: args.currency,
      }),
    },
  };
  initStripe(undefined, mockStripe);

  const result = await createPaymentIntent({ amount: 2000, currency: "usd" });

  assert.equal(typeof result.paymentId, "string");
  assert.equal(result.paymentId.startsWith("pi_"), true, "paymentId starts with pi_");
  assert.equal(typeof result.clientSecret, "string");
  assert.ok(result.clientSecret.includes("_secret_"), "clientSecret contains _secret_");
  assert.equal(result.amount, 2000);
  assert.equal(result.currency, "usd");
  assert.equal(result.provider, "stripe");
});

test("createPaymentIntent uses default currency 'usd' when not provided", async () => {
  const mockStripe = {
    paymentIntents: {
      create: async (args) => ({
        id: "pi_fixed",
        client_secret: "pi_fixed_secret_xyz",
        amount: args.amount,
        currency: args.currency,
      }),
    },
  };
  initStripe(undefined, mockStripe);

  const result = await createPaymentIntent({ amount: 5000 });

  assert.equal(result.currency, "usd");
});

test("createPaymentIntent passes amount and currency to Stripe paymentIntents.create", async () => {
  let capturedArgs = null;
  const mockStripe = {
    paymentIntents: {
      create: async (args) => {
        capturedArgs = args;
        return {
          id: "pi_fixed",
          client_secret: "pi_fixed_secret_xyz",
          amount: args.amount,
          currency: args.currency,
        };
      },
    },
  };
  initStripe(undefined, mockStripe);

  await createPaymentIntent({ amount: 3450, currency: "eur" });

  assert.equal(capturedArgs.amount, 3450);
  assert.equal(capturedArgs.currency, "eur");
});

test("createPaymentIntent throws and preserves Stripe error message", async () => {
  const mockStripe = {
    paymentIntents: {
      create: async () => {
        const err = new Error("Your card was declined");
        err.type = "StripeCardError";
        throw err;
      },
    },
  };
  initStripe(undefined, mockStripe);

  await assert.rejects(
    () => createPaymentIntent({ amount: 1000 }),
    /Your card was declined/
  );
});
