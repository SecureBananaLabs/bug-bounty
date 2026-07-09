import test from "node:test";
import assert from "node:assert/strict";

test("POST /api/payments input validation", async (t) => {
  process.env.JWT_SECRET = "testsecret";
  const { createApp } = await import("../app.js");
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  t.after(async () => {
    if (typeof server.closeAllConnections === "function") {
      server.closeAllConnections();
    }
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  await t.test("allows valid payments", async () => {
    const res = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: 50, currency: "usd" })
    });
    assert.equal(res.status, 201);
  });

  await t.test("rejects non-positive amount", async () => {
    const res = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: 0, currency: "usd" })
    });
    assert.equal(res.status, 400);
  });

  await t.test("rejects negative amount", async () => {
    const res = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: -10, currency: "usd" })
    });
    assert.equal(res.status, 400);
  });

  await t.test("rejects invalid currency code length", async () => {
    const res = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: 100, currency: "usdd" })
    });
    assert.equal(res.status, 400);
  });

  await t.test("rejects non-alphabetical currency code", async () => {
    const res = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: 100, currency: "123" })
    });
    assert.equal(res.status, 400);
  });
});
