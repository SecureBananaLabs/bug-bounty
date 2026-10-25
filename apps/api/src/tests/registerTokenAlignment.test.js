import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("POST /api/auth/register returns id matching token subject even if Date.now() changes", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  // Stub Date.now() to return different values on successive calls
  const originalDateNow = Date.now;
  let callCount = 0;
  Date.now = () => {
    callCount++;
    return callCount === 1 ? 1000000 : 2000000; // Different timestamps
  };

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test@example.com",
        password: "password123",
        role: "client"
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.ok(payload.data.id);
    assert.ok(payload.data.token);

    // Decode the token and verify the subject matches the returned id
    const parts = payload.data.token.split(".");
    const decoded = JSON.parse(Buffer.from(parts[1], "base64").toString());
    assert.equal(decoded.sub, payload.data.id, "Token subject must match returned user id");
  } finally {
    Date.now = originalDateNow;
  }

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
