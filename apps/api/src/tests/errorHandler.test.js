import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(fn) {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const { port } = server.address();
  
  try {
    await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("Zod validation errors return 400 Bad Request instead of 500", async () => {
  await withServer(async (baseUrl) => {
    // Send an invalid payload to /api/auth/register (missing email, short password)
    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "invalid", password: "123" }) // Should fail zod validation
    });
    
    const payload = await response.json();
    
    assert.equal(response.status, 400, `Expected 400 Bad Request, got ${response.status}`);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Validation failed");
    assert.ok(payload.errors, "Expected 'errors' array in response");
  });
});
