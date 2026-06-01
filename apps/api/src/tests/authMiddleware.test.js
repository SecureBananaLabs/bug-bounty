import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { createApp } from "../app.js";
import { env } from "../config/env.js";
import { signAccessToken } from "../utils/jwt.js";

async function withServer(run) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function getMetrics(baseUrl, token) {
  return fetch(`${baseUrl}/api/admin/metrics`, {
    headers: { authorization: `Bearer ${token}` }
  });
}

test("auth middleware accepts app tokens with required identity claims", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "usr_valid", role: "admin" });
    const response = await getMetrics(baseUrl, token);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
  });
});

test("auth middleware rejects tokens missing identity claims", async () => {
  await withServer(async (baseUrl) => {
    const missingSub = jwt.sign({ role: "admin" }, env.jwtSecret);
    const blankSub = jwt.sign({ sub: "   ", role: "admin" }, env.jwtSecret);
    const missingRole = jwt.sign({ sub: "usr_missing_role" }, env.jwtSecret);
    const unsupportedRole = jwt.sign({ sub: "usr_owner", role: "owner" }, env.jwtSecret);
    const stringPayload = jwt.sign("usr_string_payload", env.jwtSecret);

    for (const token of [missingSub, blankSub, missingRole, unsupportedRole, stringPayload]) {
      const response = await getMetrics(baseUrl, token);
      const payload = await response.json();

      assert.equal(response.status, 401);
      assert.deepEqual(payload, { success: false, message: "Invalid token" });
    }
  });
});
