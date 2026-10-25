import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/app.js";
import { signAccessToken } from "../src/utils/jwt.js";

describe("Payment API Security Test Suite (POST /api/payments)", () => {
  let server;
  let baseUrl;

  test("Setup test HTTP server", async () => {
    const app = createApp();
    server = app.listen(0);

    await new Promise((resolve, reject) => {
      server.once("listening", resolve);
      server.once("error", reject);
    });

    const { port } = server.address();
    baseUrl = `http://127.0.0.1:${port}`;
  });

  test("Scenario 1: Request WITHOUT Authorization header returns 401 Unauthorized", async () => {
    const response = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount: 2500,
        currency: "usd"
      })
    });

    const payload = await response.json();
    assert.equal(response.status, 401, "Expected HTTP 401 for unauthenticated request");
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Unauthorized");
  });

  test("Scenario 2: Request WITH valid Bearer token passes to controller and returns 201 Created", async () => {
    const validToken = signAccessToken({
      userId: "usr_auditor_99",
      role: "client"
    });

    const response = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${validToken}`
      },
      body: JSON.stringify({
        amount: 5000,
        currency: "usd"
      })
    });

    const payload = await response.json();
    assert.equal(response.status, 201, "Expected HTTP 201 for authenticated payment intent creation");
    assert.equal(payload.success, true);
    assert.equal(payload.data.amount, 5000);
    assert.equal(payload.data.currency, "usd");
    assert.equal(payload.data.provider, "stripe");
    assert.match(payload.data.paymentId, /^pay_\d+$/);
  });

  test("Teardown test HTTP server", async () => {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });
});
