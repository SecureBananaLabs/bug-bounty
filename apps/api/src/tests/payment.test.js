import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

test("createPaymentIntent returns a server-owned createdAt timestamp", async () => {
  const result = await createPaymentIntent({ amount: 250, currency: "usd" });

  assert.equal(typeof result.createdAt, "string");
  assert.ok(!Number.isNaN(Date.parse(result.createdAt)));
});

test("createPaymentIntent ignores caller-provided createdAt values", async () => {
  const beforeRequest = Date.now();
  const result = await createPaymentIntent({
    amount: 250,
    currency: "usd",
    createdAt: "2000-01-01T00:00:00.000Z"
  });

  assert.notEqual(result.createdAt, "2000-01-01T00:00:00.000Z");
  assert.ok(Date.parse(result.createdAt) >= beforeRequest);
});
