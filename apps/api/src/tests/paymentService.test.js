import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

test("createPaymentIntent includes a server-owned createdAt timestamp", async () => {
  const before = Date.now();
  const intent = await createPaymentIntent({ amount: 250, currency: "usd" });
  const after = Date.now();

  assert.equal(intent.amount, 250);
  assert.equal(intent.currency, "usd");
  assert.equal(intent.provider, "stripe");
  assert.match(intent.createdAt, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);

  const createdAtTime = Date.parse(intent.createdAt);
  assert.ok(Number.isFinite(createdAtTime));
  assert.ok(createdAtTime >= before);
  assert.ok(createdAtTime <= after);
});
