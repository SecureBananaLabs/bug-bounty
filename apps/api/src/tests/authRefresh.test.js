import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";

import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";
import { env } from "../config/env.js";

test("POST /api/auth/refresh rejects unauthenticated requests", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/refresh`, {
      method: "POST"
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, {
      success: false,
      message: "Unauthorized"
    });
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("POST /api/auth/refresh preserves the authenticated subject and role", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    const sourceToken = signAccessToken({ sub: "usr_refresh", role: "freelancer" });
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/refresh`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${sourceToken}`
      }
    });
    const payload = await response.json();
    const decoded = jwt.verify(payload.data.token, env.jwtSecret);

    assert.equal(response.status, 200);
    assert.equal(decoded.sub, "usr_refresh");
    assert.equal(decoded.role, "freelancer");
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
