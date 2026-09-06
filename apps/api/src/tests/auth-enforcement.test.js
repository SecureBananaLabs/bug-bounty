// Regression tests for authentication enforcement on /api routes.
//
// Background: only /api/admin applied authMiddleware; every other /api route
// was reachable without any token (broken access control). This test verifies
// that protected routes now REQUIRE a valid Bearer token, while the auth
// endpoints (register/login) stay public.
//
// NOTE: env.js resolves the JWT secret at import time, so we set JWT_SECRET
// before importing the app (static imports are hoisted, hence dynamic import).

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret-value";

import test from "node:test";
import assert from "node:assert/strict";
import { signAccessToken } from "../utils/jwt.js";

const { createApp } = await import("../app.js");

async function withServer(run) {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  try {
    const { port } = server.address();
    await run(port);
  } finally {
    server.closeIdleConnections?.();
    server.closeAllConnections?.();
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("protected route rejects requests without a token", async () => {
  await withServer(async (port) => {
    const res = await fetch(`http://127.0.0.1:${port}/api/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    assert.equal(res.status, 401);
  });
});

test("protected route rejects an invalid token", async () => {
  await withServer(async (port) => {
    const res = await fetch(`http://127.0.0.1:${port}/api/users`, {
      headers: { Authorization: "Bearer not-a-real-token" },
    });
    assert.equal(res.status, 401);
  });
});

test("protected route accepts a valid token", async () => {
  const token = signAccessToken({ sub: "usr_test", role: "client" });
  await withServer(async (port) => {
    const res = await fetch(`http://127.0.0.1:${port}/api/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(res.status, 200);
  });
});

test("auth endpoints remain public (no token required)", async () => {
  await withServer(async (port) => {
    const res = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "a@b.com", password: "password123" }),
    });
    assert.equal(res.status, 200);
  });
});
