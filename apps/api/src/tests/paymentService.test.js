import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

test("createPaymentIntent adds a server-owned createdAt timestamp", async () => {
  const before = Date.now();

  const intent = await createPaymentIntent({
    amount: 250,
    currency: "eur",
    createdAt: "2000-01-01T00:00:00.000Z"
  });

  const after = Date.now();
  const createdAtTime = Date.parse(intent.createdAt);

  assert.equal(intent.amount, 250);
  assert.equal(intent.currency, "eur");
  assert.equal(intent.provider, "stripe");
  assert.equal(typeof intent.createdAt, "string");
  assert.ok(Number.isFinite(createdAtTime));
  assert.ok(createdAtTime >= before);
  assert.ok(createdAtTime <= after);
  assert.notEqual(intent.createdAt, "2000-01-01T00:00:00.000Z");
});

test("createPaymentIntent keeps the existing default currency behavior", async () => {
  const intent = await createPaymentIntent({ amount: 100 });

  assert.equal(intent.currency, "usd");
  assert.ok(Number.isFinite(Date.parse(intent.createdAt)));
});
