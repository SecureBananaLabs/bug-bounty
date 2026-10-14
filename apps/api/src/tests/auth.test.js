import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

test("POST /api/auth issues and refreshes tokens", async (t) => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}/api/auth`;

  let validRefreshToken = "";

  await t.test("login returns access and refresh tokens", async () => {
    const response = await fetch(`${baseUrl}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@example.com", password: "password123" })
    });
    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.ok(payload.data.token);
    assert.ok(payload.data.refreshToken);
    validRefreshToken = payload.data.refreshToken;
  });

  await t.test("refresh rejects missing refresh token", async () => {
    const response = await fetch(`${baseUrl}/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });
    assert.equal(response.status, 400);
  });

  await t.test("refresh rejects invalid token type (e.g. access token passed as refresh)", async () => {
    const accessToken = signAccessToken({ sub: "hacker" });
    const response = await fetch(`${baseUrl}/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: accessToken })
    });
    assert.equal(response.status, 401);
  });

  await t.test("refresh accepts valid refresh token", async () => {
    const response = await fetch(`${baseUrl}/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: validRefreshToken })
    });
    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.ok(payload.data.token);
  });

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
