import test from "node:test";
import assert from "node:assert/strict";

test("env.js should throw if JWT_SECRET is missing in production", async () => {
  // Save original env
  const origEnv = process.env.NODE_ENV;
  const origJwt = process.env.JWT_SECRET;
  
  process.env.NODE_ENV = "production";
  delete process.env.JWT_SECRET;

  try {
    // Dynamic import to re-evaluate module
    await import(`../config/env.js?t=${Date.now()}`);
    assert.fail("Should have thrown an error");
  } catch (err) {
    assert.match(err.message, /JWT_SECRET is required/);
  } finally {
    process.env.NODE_ENV = origEnv;
    if (origJwt) process.env.JWT_SECRET = origJwt;
  }
});
