import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

test("createPaymentIntent adds a server-owned createdAt timestamp", async () => {
  const beforeCreate = Date.now();
  const intent = await createPaymentIntent({
    amount: 125,
    currency: "usd",
    jobId: "job_created_at",
    createdAt: "2000-01-01T00:00:00.000Z"
  });
  const afterCreate = Date.now();

  assert.equal(typeof intent.createdAt, "string");

  const createdAtTime = Date.parse(intent.createdAt);
  assert.ok(Number.isFinite(createdAtTime));
  assert.ok(createdAtTime >= beforeCreate);
  assert.ok(createdAtTime <= afterCreate);
  assert.notEqual(intent.createdAt, "2000-01-01T00:00:00.000Z");
});
