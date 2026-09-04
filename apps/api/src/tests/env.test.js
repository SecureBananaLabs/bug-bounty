import test from "node:test";
import assert from "node:assert/strict";

async function loadEnvWith(overrides) {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalJwtSecret = process.env.JWT_SECRET;

  if (Object.prototype.hasOwnProperty.call(overrides, "NODE_ENV")) {
    process.env.NODE_ENV = overrides.NODE_ENV;
  } else {
    delete process.env.NODE_ENV;
  }

  if (Object.prototype.hasOwnProperty.call(overrides, "JWT_SECRET")) {
    process.env.JWT_SECRET = overrides.JWT_SECRET;
  } else {
    delete process.env.JWT_SECRET;
  }

  try {
    return await import(`../config/env.js?test=${Date.now()}-${Math.random()}`);
  } finally {
    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }

    if (originalJwtSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalJwtSecret;
    }
  }
}

test("development uses the local JWT secret fallback", async () => {
  const { env } = await loadEnvWith({ NODE_ENV: "development" });

  assert.equal(env.nodeEnv, "development");
  assert.equal(env.jwtSecret, "development-secret");
});

test("non-development requires JWT_SECRET", async () => {
  await assert.rejects(
    loadEnvWith({ NODE_ENV: "production" }),
    /JWT_SECRET is required when NODE_ENV is not development/
  );
});

test("non-development accepts an explicit JWT_SECRET", async () => {
  const { env } = await loadEnvWith({ NODE_ENV: "production", JWT_SECRET: "test-secret" });

  assert.equal(env.nodeEnv, "production");
  assert.equal(env.jwtSecret, "test-secret");
});