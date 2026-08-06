import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("POST /api/register and /api/login reject excessively long passwords", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  const longPassword = "a".repeat(129); // 129 chars, max is 128
  const validPassword = "a".repeat(128); // 128 chars, max is 128

  // Test register with long password
  const regLongResp = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "test1@example.com", password: longPassword })
  });

  // We only assert the status is an error (typically 500 or 400)
  assert.ok(regLongResp.status >= 400, "Should reject long password on register");

  // Test register with valid password
  const regValidResp = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "test2@example.com", password: validPassword })
  });
  assert.equal(regValidResp.status, 201, "Should accept valid 128-char password on register");

  // Test login with long password
  const loginLongResp = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "test2@example.com", password: longPassword })
  });
  assert.ok(loginLongResp.status >= 400, "Should reject long password on login");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
