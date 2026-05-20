import test from "node:test";
import assert from "node:assert/strict";
import Stripe from "stripe";
import { createPaymentIntent } from "../services/paymentService.js";

test("paymentService.js unit and integration tests", async (t) => {
  const originalCreate = Stripe.resources.PaymentIntents.prototype.create;
  let lastCallArgs = null;

  t.afterEach(() => {
    Stripe.resources.PaymentIntents.prototype.create = originalCreate;
    lastCallArgs = null;
  });

  await t.test("createPaymentIntent validates amount is required", async () => {
    await assert.rejects(
      createPaymentIntent({}),
      /Amount is required/
    );
    await assert.rejects(
      createPaymentIntent(null),
      /Amount is required/
    );
  });

  await t.test("createPaymentIntent validates amount is a positive integer", async () => {
    await assert.rejects(
      createPaymentIntent({ amount: -100 }),
      /Amount must be a positive integer/
    );
    await assert.rejects(
      createPaymentIntent({ amount: 10.5 }),
      /Amount must be a positive integer/
    );
    await assert.rejects(
      createPaymentIntent({ amount: 0 }),
      /Amount must be a positive integer/
    );
  });

  await t.test("createPaymentIntent creates Stripe payment intent successfully", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_mock";

    Stripe.resources.PaymentIntents.prototype.create = async function (params) {
      lastCallArgs = params;
      return {
        id: "pi_mock_123",
        client_secret: "pi_mock_123_secret_abc",
        amount: params.amount,
        currency: params.currency
      };
    };

    const result = await createPaymentIntent({ amount: 1500, currency: "usd" });

    assert.deepEqual(result, {
      paymentId: "pi_mock_123",
      clientSecret: "pi_mock_123_secret_abc",
      amount: 1500,
      currency: "usd",
      provider: "stripe"
    });

    assert.deepEqual(lastCallArgs, {
      amount: 1500,
      currency: "usd",
      metadata: {}
    });
  });

  await t.test("createPaymentIntent catches and re-throws Stripe errors", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_mock";

    Stripe.resources.PaymentIntents.prototype.create = async function () {
      throw {
        message: "Your card was declined."
      };
    };

    await assert.rejects(
      createPaymentIntent({ amount: 1500 }),
      /Your card was declined./
    );
  });

  if (process.env.RUN_STRIPE_INTEGRATION_TESTS === "true") {
    await t.test("Stripe integration/smoke test (real Stripe API call)", async () => {
      const result = await createPaymentIntent({ amount: 500, currency: "usd" });
      assert.ok(result.paymentId.startsWith("pi_"));
      assert.ok(result.clientSecret);
      assert.equal(result.amount, 500);
      assert.equal(result.currency, "usd");
    });
  }
});
