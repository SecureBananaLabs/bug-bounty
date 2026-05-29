import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent, setStripeInstance, stripe } from "../services/paymentService.js";
import Stripe from "stripe";

test("Payment Service Unit Tests", async (t) => {
  const originalStripe = stripe;

  await t.test("Throws error if amount is missing", async () => {
    await assert.rejects(
      createPaymentIntent({ currency: "usd" }),
      /Amount is required/
    );
  });

  await t.test("Throws error if amount is not an integer", async () => {
    await assert.rejects(
      createPaymentIntent({ amount: 10.5 }),
      /Amount must be a positive integer/
    );
  });

  await t.test("Throws error if amount is not positive", async () => {
    await assert.rejects(
      createPaymentIntent({ amount: -10 }),
      /Amount must be a positive integer/
    );
    await assert.rejects(
      createPaymentIntent({ amount: 0 }),
      /Amount must be a positive integer/
    );
  });

  await t.test("Successfully creates a PaymentIntent and returns standard fields with mocked Stripe client", async () => {
    let passedArgs = null;
    const mockStripe = {
      paymentIntents: {
        create: async (args) => {
          passedArgs = args;
          return {
            id: "pi_12345",
            client_secret: "secret_12345",
            amount: args.amount,
            currency: args.currency
          };
        }
      }
    };

    setStripeInstance(mockStripe);

    const result = await createPaymentIntent({ amount: 2000 });
    assert.deepEqual(passedArgs, { amount: 2000, currency: "usd" });
    assert.equal(result.paymentId, "pi_12345");
    assert.equal(result.clientSecret, "secret_12345");
    assert.equal(result.amount, 2000);
    assert.equal(result.currency, "usd");
    assert.equal(result.provider, "stripe");

    setStripeInstance(originalStripe);
  });

  await t.test("Propagates/re-throws Stripe API errors with original message preserved", async () => {
    const mockStripeWithError = {
      paymentIntents: {
        create: async () => {
          const stripeError = new Error("Your card was declined.");
          stripeError.type = "StripeCardError";
          throw stripeError;
        }
      }
    };

    setStripeInstance(mockStripeWithError);

    await assert.rejects(
      createPaymentIntent({ amount: 2000 }),
      (err) => {
        assert.equal(err.message, "Your card was declined.");
        assert.equal(err.type, "StripeCardError");
        return true;
      }
    );

    setStripeInstance(originalStripe);
  });

  // Integration/smoke test (guarded by an env flag)
  await t.test("Integration/Smoke Test - stripe live API integration", { skip: !process.env.RUN_STRIPE_INTEGRATION_TESTS }, async () => {
    // This will run only if RUN_STRIPE_INTEGRATION_TESTS is set
    // It verifies real integration using test mode Stripe key from environment
    assert.ok(process.env.STRIPE_SECRET_KEY, "STRIPE_SECRET_KEY is required for integration tests");
    const result = await createPaymentIntent({ amount: 500, currency: "usd" });
    assert.ok(result.paymentId.startsWith("pi_"), "paymentId should start with pi_");
    assert.ok(result.clientSecret.startsWith("pi_"), "clientSecret should start with pi_");
    assert.equal(result.amount, 500);
    assert.equal(result.currency, "usd");
  });
});
