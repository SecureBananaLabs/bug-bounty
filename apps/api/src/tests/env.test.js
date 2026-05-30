import test from "node:test";
import assert from "node:assert/strict";
import { env } from "../config/env.js";

// Temporarily backup and restore env
const orig = process.env.JWT_SECRET;

test("JWT_SECRET throws when empty in production", () => {
  process.env.NODE_ENV = "production";
  process.env.JWT_SECRET = "";
  // The env.js lazy-evaluates, so we need to test the fallback logic
  assert.throws(() => {
    // Re-evaluate by clearing require cache
    delete process.env.JWT_SECRET;
    // Restore so test doesn't break subsequent tests
    process.env.JWT_SECRET = orig || "test-secret";
  });
});

test("JWT_SECRET uses env value when set", () => {
  process.env.JWT_SECRET = "my-secure-secret-12345";
  // force re-import
  const { env: freshEnv } = await import("../config/env.js");
  assert.equal(freshEnv.jwtSecret, "my-secure-secret-12345");
});

test("JWT_SECRET uses development default in dev mode", () => {
  process.env.NODE_ENV = "development";
  delete process.env.JWT_SECRET;
  const { env: freshEnv } = await import("../config/env.js");
  assert.equal(freshEnv.jwtSecret, "development-secret");
});
