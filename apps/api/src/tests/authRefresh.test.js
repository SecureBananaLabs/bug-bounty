import test from "node:test";
import assert from "node:assert/strict";
import { signAccessToken } from "../utils/jwt.js";

test("POST /api/auth/refresh validation and verification checks", async (t) => {
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

  await t.test("rejects missing refreshToken with 400", async () => {
    const res = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });
    assert.equal(res.status, 400);
  });

  await t.test("rejects empty refreshToken with 400", async () => {
    const res = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: "" })
    });
    assert.equal(res.status, 400);
  });

  await t.test("rejects malformed refreshToken with 401", async () => {
    const res = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: "invalid-token-string" })
    });
    assert.equal(res.status, 401);
  });

  await t.test("allows valid refreshToken and returns new token with same claims", async () => {
    const originalToken = signAccessToken({ sub: "usr_custom_123", role: "freelancer" });
    const res = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: originalToken })
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(body.success);
    assert.ok(body.data.token);

    const { verifyAccessToken } = await import("../utils/jwt.js");
    const verified = verifyAccessToken(body.data.token);
    assert.equal(verified.sub, "usr_custom_123");
    assert.equal(verified.role, "freelancer");
  });
});
