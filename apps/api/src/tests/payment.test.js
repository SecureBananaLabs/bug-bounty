import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

describe("Payment API validation and bounds", () => {
  let server;
  let baseUrl;

  before(async () => {
    const app = createApp();
    server = app.listen(0);
    await new Promise((resolve, reject) => {
      server.once("listening", resolve);
      server.once("error", reject);
    });
    const { port } = server.address();
    baseUrl = `http://127.0.0.1:${port}/api/payments`;
  });

  after(async () => {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });

  async function postPayment(body) {
    const res = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const payload = await res.json();
    return { status: res.status, payload };
  }

  it("Valid payment with explicit currency returns 201 with created object", async () => {
    const { status, payload } = await postPayment({ amount: 1500, currency: "EUR" });
    assert.equal(status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.amount, 1500);
    assert.equal(payload.data.currency, "eur");
    assert.ok(payload.data.paymentId);
  });

  it("Valid payment without currency defaults to 'usd' and returns 201", async () => {
    const { status, payload } = await postPayment({ amount: 200 });
    assert.equal(status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.amount, 200);
    assert.equal(payload.data.currency, "usd");
    assert.ok(payload.data.paymentId);
  });

  it("Missing amount returns HTTP 400", async () => {
    const { status, payload } = await postPayment({ currency: "usd" });
    assert.equal(status, 400);
    assert.equal(payload.ok, false);
    assert.ok(Array.isArray(payload.issues));
  });

  it("Zero amount returns HTTP 400", async () => {
    const { status, payload } = await postPayment({ amount: 0 });
    assert.equal(status, 400);
    assert.equal(payload.ok, false);
    assert.ok(Array.isArray(payload.issues));
  });

  it("Negative amount returns HTTP 400", async () => {
    const { status, payload } = await postPayment({ amount: -10 });
    assert.equal(status, 400);
    assert.equal(payload.ok, false);
    assert.ok(Array.isArray(payload.issues));
  });

  it("Non-numeric amount returns HTTP 400", async () => {
    const { status, payload } = await postPayment({ amount: "one-hundred" });
    assert.equal(status, 400);
    assert.equal(payload.ok, false);
    assert.ok(Array.isArray(payload.issues));
  });

  it("Exorbitant amount (> 1,000,000) returns HTTP 400", async () => {
    const { status, payload } = await postPayment({ amount: 1000001 });
    assert.equal(status, 400);
    assert.equal(payload.ok, false);
    assert.ok(Array.isArray(payload.issues));
  });

  it("Non-3-letter currency returns HTTP 400", async () => {
    const { status, payload } = await postPayment({ amount: 50, currency: "US" });
    assert.equal(status, 400);
    assert.equal(payload.ok, false);
    assert.ok(Array.isArray(payload.issues));

    const resLong = await postPayment({ amount: 50, currency: "USDT" });
    assert.equal(resLong.status, 400);
    assert.equal(resLong.payload.ok, false);
  });

  it("Non-string currency returns HTTP 400", async () => {
    const { status, payload } = await postPayment({ amount: 50, currency: 123 });
    assert.equal(status, 400);
    assert.equal(payload.ok, false);
    assert.ok(Array.isArray(payload.issues));
  });
});
