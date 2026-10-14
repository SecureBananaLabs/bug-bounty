import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

test("POST /api/auth/register token subject mapping regression test", async (t) => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}/api/auth/register`;

  await t.test("Success: returned user id matches the token sub claim", async () => {
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: `test_user_${Date.now()}@example.com`,
        password: "securepassword123",
        role: "freelancer"
      })
    });

    const payload = await response.json();
    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    
    const userId = payload.data.id;
    const token = payload.data.token;
    assert.ok(userId);
    assert.ok(token);

    // Decode token and verify subject matches returned user id
    const decoded = jwt.verify(token, env.jwtSecret);
    assert.equal(decoded.sub, userId);
    assert.equal(decoded.role, "freelancer");
  });

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
