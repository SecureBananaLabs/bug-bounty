import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { createApp } from "../app.js";
import { env } from "../config/env.js";
import { signAccessToken } from "../utils/jwt.js";

async function withServer(handler) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    return await handler(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function getAdminMetrics(token) {
  return withServer((baseUrl) =>
    fetch(`${baseUrl}/api/admin/metrics`, {
      headers: { Authorization: `Bearer ${token}` }
    })
  );
}

test("auth middleware accepts valid access token claims", async () => {
  const token = signAccessToken({ sub: "usr_123", role: "client" });
  const response = await getAdminMetrics(token);

  assert.equal(response.status, 200);
});

test("auth middleware rejects tokens missing subject claim", async () => {
  const token = signAccessToken({ role: "client" });
  const response = await getAdminMetrics(token);

  assert.equal(response.status, 401);
});

test("auth middleware rejects tokens with unsupported roles", async () => {
  const token = signAccessToken({ sub: "usr_123", role: "owner" });
  const response = await getAdminMetrics(token);

  assert.equal(response.status, 401);
});

test("auth middleware rejects non-object JWT payloads", async () => {
  const token = jwt.sign("usr_123", env.jwtSecret);
  const response = await getAdminMetrics(token);

  assert.equal(response.status, 401);
});
