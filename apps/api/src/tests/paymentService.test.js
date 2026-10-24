import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

function stripeStub(result = { id: "pi_test", client_secret: "pi_test_secret" }) {
  const calls = [];
  return { calls, paymentIntents: { create: async (params) => { calls.push(params); return result; } } };
}

test("creates and maps a Stripe PaymentIntent", async () => {
  const stripe = stripeStub();
  const result = await createPaymentIntent({ amount: 1299, currency: "USD", metadata: { orderId: "order-1" } }, { stripeClient: stripe });
  assert.deepEqual(stripe.calls, [{ amount: 1299, currency: "usd", metadata: { orderId: "order-1" } }]);
  assert.deepEqual(result, { paymentId: "pi_test", clientSecret: "pi_test_secret", amount: 1299, currency: "usd", provider: "stripe" });
});

test("rejects invalid amounts and currencies before Stripe", async () => {
  const stripe = stripeStub();
  await assert.rejects(createPaymentIntent({ amount: 0 }, { stripeClient: stripe }), /positive integer/);
  await assert.rejects(createPaymentIntent({ amount: 10.5 }, { stripeClient: stripe }), /positive integer/);
  await assert.rejects(createPaymentIntent({ amount: 100, currency: "US" }, { stripeClient: stripe }), /three-letter ISO 4217/);
  assert.deepEqual(stripe.calls, []);
});

test("preserves Stripe provider errors", async () => {
  const stripeError = Object.assign(new Error("Your card was declined"), { type: "StripeCardError" });
  const stripe = { paymentIntents: { create: async () => { throw stripeError; } } };
  await assert.rejects(createPaymentIntent({ amount: 500 }, { stripeClient: stripe }), (error) => error === stripeError && error.message === "Your card was declined");
});

test("integration test is opt-in", { skip: !process.env.STRIPE_INTEGRATION_TEST }, async () => {
  const result = await createPaymentIntent({ amount: 50, currency: "usd" });
  assert.match(result.paymentId, /^pi_/);
});
