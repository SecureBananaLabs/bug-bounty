import test from "node:test";
import assert from "node:assert/strict";

test("createPaymentIntent rejects missing amount", async () => {
  const mod = await import("../services/paymentService.js");
  await assert.rejects(
    () => mod.createPaymentIntent({}),
    { message: "amount is required and must be a positive integer (in cents)" }
  );
});

test("createPaymentIntent rejects null amount", async () => {
  const mod = await import("../services/paymentService.js");
  await assert.rejects(
    () => mod.createPaymentIntent({ amount: null }),
    { message: "amount is required and must be a positive integer (in cents)" }
  );
});

test("createPaymentIntent rejects non-integer amount", async () => {
  const mod = await import("../services/paymentService.js");
  await assert.rejects(
    () => mod.createPaymentIntent({ amount: 10.5 }),
    { message: "amount is required and must be a positive integer (in cents)" }
  );
});

test("createPaymentIntent rejects zero amount", async () => {
  const mod = await import("../services/paymentService.js");
  await assert.rejects(
    () => mod.createPaymentIntent({ amount: 0 }),
    { message: "amount is required and must be a positive integer (in cents)" }
  );
});

test("createPaymentIntent rejects negative amount", async () => {
  const mod = await import("../services/paymentService.js");
  await assert.rejects(
    () => mod.createPaymentIntent({ amount: -100 }),
    { message: "amount is required and must be a positive integer (in cents)" }
  );
});

test("createPaymentIntent defaults currency to usd", async () => {
  const mod = await import("../services/paymentService.js");
  const Stripe = (await import("stripe")).default;
  const mockCreate = new Stripe("sk_test_mock").paymentIntents.create;
  await assert.rejects(
    () => mod.createPaymentIntent({ amount: 2000 }),
    { message: /STRIPE_SECRET_KEY is not configured/ }
  );
});

test("createPaymentIntent returns expected shape on success", async () => {
  const mod = await import("../services/paymentService.js");
  const fakePi = { id: "pi_mock_123", client_secret: "pi_mock_123_secret_abc" };
  const fakeClient = { paymentIntents: { create: async () => fakePi } };

  const result = await mod.createPaymentIntent({ amount: 2000, currency: "eur" }, fakeClient);
  assert.equal(result.paymentId, "pi_mock_123");
  assert.equal(result.clientSecret, "pi_mock_123_secret_abc");
  assert.equal(result.amount, 2000);
  assert.equal(result.currency, "eur");
  assert.equal(result.provider, "stripe");
});
