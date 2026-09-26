// Regression tests for JWT secret hardening (hardcoded-default auth bypass).
//
// Background: env.js previously fell back to the hardcoded string
// "development-secret" when JWT_SECRET was unset. Because that value is in
// public source, any deployment missing the env var silently accepted
// attacker-forged tokens (full auth bypass).
//
// These tests verify the fix is fail-closed:
//   1. Tokens sign + verify correctly with a configured secret.
//   2. A token forged with the OLD default ("development-secret") is REJECTED.
//   3. The dev fallback is an ephemeral random secret, never the old default.
//   4. Production REFUSES TO START when JWT_SECRET is missing.
//
// NOTE: env.js resolves the secret at module-evaluation time, so tests that
// need a specific environment set process.env BEFORE importing and use a
// cache-busting query string to force re-evaluation.

// Set env BEFORE importing the modules under test (static imports are hoisted,
// so we use dynamic import below to honor these values).
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret-value";

import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";

const { signAccessToken, verifyAccessToken } = await import("../utils/jwt.js");

test("signs and verifies a token with the configured secret", () => {
  const token = signAccessToken({ sub: "user-123", role: "user" });
  const decoded = verifyAccessToken(token);
  assert.equal(decoded.sub, "user-123");
  assert.equal(decoded.role, "user");
});

test("rejects a token forged with the old hardcoded default secret", () => {
  // Attacker reads the public source, learns the previous default, and forges
  // an admin token with it. It must NOT validate against our real secret.
  const forged = jwt.sign({ sub: "admin", role: "admin" }, "development-secret");
  assert.throws(
    () => verifyAccessToken(forged),
    /invalid signature|JsonWebTokenError/,
  );
});

test("uses an ephemeral random secret (not the old default) in dev without JWT_SECRET", async () => {
  const prevSecret = process.env.JWT_SECRET;
  const prevEnv = process.env.NODE_ENV;
  delete process.env.JWT_SECRET;
  process.env.NODE_ENV = "development";

  const { env } = await import(`../config/env.js?devrand=${Date.now()}`);
  assert.notEqual(env.jwtSecret, "development-secret");
  assert.ok(env.jwtSecret.length >= 32, "expected a long random secret");

  process.env.JWT_SECRET = prevSecret;
  process.env.NODE_ENV = prevEnv;
});

test("refuses to start in production when JWT_SECRET is missing", async () => {
  const prevSecret = process.env.JWT_SECRET;
  const prevEnv = process.env.NODE_ENV;
  delete process.env.JWT_SECRET;
  process.env.NODE_ENV = "production";

  await assert.rejects(() => import(`../config/env.js?prod=${Date.now()}`));

  process.env.JWT_SECRET = prevSecret;
  process.env.NODE_ENV = prevEnv;
});
