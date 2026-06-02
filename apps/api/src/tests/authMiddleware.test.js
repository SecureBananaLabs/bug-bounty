import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { createApp } from "../app.js";
import { env } from "../config/env.js";
import { signAccessToken } from "../utils/jwt.js";

async function listen(app) {
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  return server;
}

async function close(server) {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

async function fetchAdminMetrics(baseUrl, token) {
  const response = await fetch(`${baseUrl}/api/admin/metrics`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return { response, payload: await response.json() };
}

test("auth middleware rejects tokens without usable identity claims", async () => {
  const app = createApp();
  const server = await listen(app);
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const invalidTokens = [
      ["string payload", jwt.sign("usr_123", env.jwtSecret)],
      ["missing subject", signAccessToken({ role: "client" })],
      ["blank subject", signAccessToken({ sub: "   ", role: "client" })],
      ["missing role", signAccessToken({ sub: "usr_123" })],
      ["unsupported role", signAccessToken({ sub: "usr_123", role: "owner" })],
    ];

    for (const [label, token] of invalidTokens) {
      const { response, payload } = await fetchAdminMetrics(baseUrl, token);

      assert.equal(response.status, 401, label);
      assert.deepEqual(payload, {
        success: false,
        message: "Invalid token claims",
      });
    }

    const validToken = signAccessToken({ sub: "usr_123", role: "client" });
    const { response, payload } = await fetchAdminMetrics(baseUrl, validToken);

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(typeof payload.data.openJobs, "number");
  } finally {
    await close(server);
  }
});
