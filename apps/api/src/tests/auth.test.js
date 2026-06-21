import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { createApp } from "../app.js";
import { env } from "../config/env.js";

test("POST /api/auth/refresh returns uppercase CLIENT role in token", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/api/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    }
  });

  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.ok(payload.data && payload.data.token, "Response should contain data.token");

  const decoded = jwt.verify(payload.data.token, env.jwtSecret);
  assert.equal(decoded.role, "CLIENT", "Role claim in token must be uppercase 'CLIENT'");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
