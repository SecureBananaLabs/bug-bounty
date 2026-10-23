import test, { describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

describe("Payment API - POST /api/payments", () => {
  let server;
  let baseUrl;

  beforeEach(async () => {
    const app = createApp();
    server = app.listen(0);
    await new Promise((resolve, reject) => {
      server.once("listening", resolve);
      server.once("error", reject);
    });
    const { port } = server.address();
    baseUrl = `http://127.0.0.1:${port}`;
  });

  afterEach(async () => {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
      server = null;
    }
  });

  test("Valid payment creation returns 201 with paymentId, amount, currency, and provider", async () => {
    const res = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: 500, currency: "usd" })
    });
    const data = await res.json();
    assert.equal(res.status, 201);
    assert.equal(data.success, true);
    assert.ok(data.data.paymentId);
    assert.equal(data.data.amount, 500);
    assert.equal(data.data.currency, "usd");
    assert.equal(data.data.provider, "stripe");
  });

  test("Missing amount returns HTTP 400", async () => {
    const res = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currency: "usd" })
    });
    const data = await res.json();
    assert.equal(res.status, 400);
    assert.equal(data.ok, false);
    assert.ok(data.error);
    assert.ok(Array.isArray(data.issues));
  });

  test("Negative amount returns HTTP 400", async () => {
    const res = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: -50 })
    });
    const data = await res.json();
    assert.equal(res.status, 400);
    assert.equal(data.ok, false);
    assert.ok(data.error);
    assert.ok(Array.isArray(data.issues));
  });

  test("Zero amount returns HTTP 400", async () => {
    const res = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: 0 })
    });
    const data = await res.json();
    assert.equal(res.status, 400);
    assert.equal(data.ok, false);
    assert.ok(data.error);
    assert.ok(Array.isArray(data.issues));
  });

  test("Non-numeric amount returns HTTP 400", async () => {
    const res = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: "one-hundred" })
    });
    const data = await res.json();
    assert.equal(res.status, 400);
    assert.equal(data.ok, false);
    assert.ok(data.error);
    assert.ok(Array.isArray(data.issues));
  });

  test("Amount exceeding 1,000,000 returns HTTP 400", async () => {
    const res = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: 1000000.01 })
    });
    const data = await res.json();
    assert.equal(res.status, 400);
    assert.equal(data.ok, false);
    assert.ok(data.error);
    assert.ok(Array.isArray(data.issues));
  });

  test("Invalid currency returns HTTP 400", async () => {
    for (const invalidCurrency of ["USDT", "toolong", "123", "us-"]) {
      const res = await fetch(`${baseUrl}/api/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 100, currency: invalidCurrency })
      });
      const data = await res.json();
      assert.equal(res.status, 400, `Expected 400 for currency: ${invalidCurrency}`);
      assert.equal(data.ok, false);
      assert.ok(data.error);
      assert.ok(Array.isArray(data.issues));
    }
  });

  test("Default currency 'usd' is set when omitted", async () => {
    const res = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: 250 })
    });
    const data = await res.json();
    assert.equal(res.status, 201);
    assert.equal(data.success, true);
    assert.equal(data.data.currency, "usd");
  });

  test("Uppercase currency 'EUR' is lowercased to 'eur'", async () => {
    const res = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: 250, currency: "EUR" })
    });
    const data = await res.json();
    assert.equal(res.status, 201);
    assert.equal(data.success, true);
    assert.equal(data.data.currency, "eur");
  });
});
