import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

test("createPaymentIntent includes a server-owned createdAt timestamp", async () => {
  const before = Date.now();
  const intent = await createPaymentIntent({ amount: 250, currency: "usd" });
  const after = Date.now();

  const createdAt = Date.parse(intent.createdAt);

  assert.equal(intent.amount, 250);
  assert.equal(intent.currency, "usd");
  assert.equal(intent.provider, "stripe");
  assert.ok(Number.isFinite(createdAt));
  assert.ok(createdAt >= before);
  assert.ok(createdAt <= after);
});

test("createPaymentIntent does not trust caller-provided createdAt", async () => {
  const callerCreatedAt = "2000-01-01T00:00:00.000Z";
  const intent = await createPaymentIntent({
    amount: 250,
    currency: "usd",
    createdAt: callerCreatedAt
  });

  assert.notEqual(intent.createdAt, callerCreatedAt);
  assert.ok(Number.isFinite(Date.parse(intent.createdAt)));
});
