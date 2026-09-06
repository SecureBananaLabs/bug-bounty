import test from "node:test";
import assert from "node:assert/strict";

process.env.NODE_ENV = "production";
delete process.env.STRIPE_SECRET_KEY;

const { createPaymentIntent } = await import("../services/paymentService.js");

test("createPaymentIntent rejects production requests when Stripe is not configured", async () => {
  await assert.rejects(
    createPaymentIntent({ amount: 100, currency: "usd" }),
    (error) => {
      assert.equal(error.message, "Payment provider is not configured");
      assert.equal(error.status, 503);
      assert.equal(error.statusCode, 503);
      return true;
    }
  );
});
