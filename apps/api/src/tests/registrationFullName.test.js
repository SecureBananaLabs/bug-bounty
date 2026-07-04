import test from "node:test";
import assert from "node:assert/strict";

test("POST /api/auth/register fullName validation", async (t) => {
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

  await t.test("rejects registration when fullName is omitted", async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: "test@example.com",
        password: "password123",
        role: "client"
      })
    });
    assert.equal(res.status, 400);
  });

  await t.test("rejects registration when fullName is whitespace-only", async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: "test@example.com",
        password: "password123",
        fullName: "   ",
        role: "client"
      })
    });
    assert.equal(res.status, 400);
  });

  await t.test("accepts registration when fullName is valid and preserves it", async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: "test@example.com",
        password: "password123",
        fullName: "John Doe",
        role: "client"
      })
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.data.fullName, "John Doe");
  });
});
