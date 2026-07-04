import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("Auth Controller Error Handling", async (t) => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  t.after(() => {
    server.close();
  });

  await t.test("POST /api/auth/register handles invalid payload error", async () => {
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "invalid" })
    });
    // Expected: 500 Internal Server Error (forwarded to errorHandler)
    assert.equal(response.status, 500);
    const data = await response.json();
    assert.equal(data.success, false);
    assert.equal(data.message, "Unexpected server error");
  });

  await t.test("POST /api/auth/login handles invalid payload error", async () => {
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "invalid" })
    });
    // Expected: 500 Internal Server Error (forwarded to errorHandler)
    assert.equal(response.status, 500);
    const data = await response.json();
    assert.equal(data.success, false);
    assert.equal(data.message, "Unexpected server error");
  });
});
