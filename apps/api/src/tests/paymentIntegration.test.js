import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY ?? "";

test("Stripe payment integration", { skip: !STRIPE_SECRET_KEY.startsWith("sk_test_") }, async (t) => {
  // ---------------------------------------------------------------------------
  // Test 1 — create a successful PaymentIntent
  // ---------------------------------------------------------------------------
  await t.test("creates a PaymentIntent with valid amount and default currency", async () => {
    const payload = { amount: 2000 }; // $20.00 in cents
    const result = await createPaymentIntent(payload, "test-user-001");

    // Shape contract
    assert.ok(result, "result should be truthy");
    assert.equal(typeof result.clientSecret, "string", "clientSecret should be a string");
    assert.ok(result.clientSecret.startsWith("pi_3"), "clientSecret should be a valid Stripe secret — starts with pi_3…");
    assert.equal(typeof result.paymentId, "string", "paymentId should be a string");
    assert.ok(result.paymentId.startsWith("pi_"), "paymentId should start with pi_");

    // Amount / currency correctness
    assert.equal(result.amount, 2000, "amount should be 2000 (the value we sent in cents)");
    assert.equal(result.currency, "usd", "currency should default to usd");

    // Status
    assert.equal(result.status, "requires_payment_method", "fresh PI should have status requires_payment_method");
  });

  // ---------------------------------------------------------------------------
  // Test 2 — custom currency (EUR)
  // ---------------------------------------------------------------------------
  await t.test("creates a PaymentIntent with custom currency (EUR)", async () => {
    const payload = { amount: 1500, currency: "eur" };
    const result = await createPaymentIntent(payload, "test-user-002");

    assert.equal(result.amount, 1500);
    assert.equal(result.currency, "eur");
    assert.ok(result.paymentId.startsWith("pi_"));
  });

  // ---------------------------------------------------------------------------
  // Test 3 — with jobId metadata
  // ---------------------------------------------------------------------------
  await t.test("creates a PaymentIntent with jobId in metadata", async () => {
    const payload = { amount: 500, jobId: "job-789" };
    const result = await createPaymentIntent(payload, "test-user-003");

    assert.equal(result.amount, 500);
    assert.equal(result.currency, "usd");
    assert.ok(result.paymentId.startsWith("pi_"));
  });

  // ---------------------------------------------------------------------------
  // Test 4 — rejects invalid amount (under 50 cents)
  // ---------------------------------------------------------------------------
  await t.test("rejects amount below minimum (49 cents)", async () => {
    const payload = { amount: 49 };
    await assert.rejects(
      () => createPaymentIntent(payload, "test-user-004"),
      { message: "Invalid or missing amount (min 50 cents, integer)" }
    );
  });

  // ---------------------------------------------------------------------------
  // Test 5 — rejects non-integer amount
  // ---------------------------------------------------------------------------
  await t.test("rejects non-integer amount", async () => {
    const payload = { amount: 19.99 };
    await assert.rejects(
      () => createPaymentIntent(payload, "test-user-005"),
      { message: "Invalid or missing amount (min 50 cents, integer)" }
    );
  });
});
