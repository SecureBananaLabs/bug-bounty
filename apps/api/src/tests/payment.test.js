import test from "node:test";
import assert from "node:assert/strict";
import { createPayment } from "../controllers/paymentController.js";
import { createPaymentIntent } from "../services/paymentService.js";

test("createPaymentIntent returns a server-owned createdAt timestamp", async () => {
  const beforeRequest = Date.now();
  const result = await createPaymentIntent({ amount: 250, currency: "usd" });
  const afterRequest = Date.now();
  const createdAtTime = Date.parse(result.createdAt);

  assert.equal(typeof result.createdAt, "string");
  assert.ok(Number.isFinite(createdAtTime));
  assert.ok(createdAtTime >= beforeRequest);
  assert.ok(createdAtTime <= afterRequest);
});

test("createPaymentIntent ignores caller-provided createdAt values", async () => {
  const beforeRequest = Date.now();
  const result = await createPaymentIntent({
    amount: 250,
    currency: "usd",
    createdAt: "2000-01-01T00:00:00.000Z"
  });
  const afterRequest = Date.now();
  const createdAtTime = Date.parse(result.createdAt);

  assert.notEqual(result.createdAt, "2000-01-01T00:00:00.000Z");
  assert.ok(Number.isFinite(createdAtTime));
  assert.ok(createdAtTime >= beforeRequest);
  assert.ok(createdAtTime <= afterRequest);
});

test("createPayment returns createdAt in the API response envelope", async () => {
  let responseStatus;
  let responsePayload;
  const beforeRequest = Date.now();

  await createPayment(
    {
      body: {
        amount: 250,
        currency: "usd",
        createdAt: "2000-01-01T00:00:00.000Z"
      }
    },
    {
      status(status) {
        responseStatus = status;
        return this;
      },
      json(payload) {
        responsePayload = payload;
        return payload;
      }
    }
  );
  const afterRequest = Date.now();
  const createdAtTime = Date.parse(responsePayload.data.createdAt);

  assert.equal(responseStatus, 201);
  assert.equal(responsePayload.success, true);
  assert.equal(typeof responsePayload.data.createdAt, "string");
  assert.notEqual(responsePayload.data.createdAt, "2000-01-01T00:00:00.000Z");
  assert.ok(Number.isFinite(createdAtTime));
  assert.ok(createdAtTime >= beforeRequest);
  assert.ok(createdAtTime <= afterRequest);
});
