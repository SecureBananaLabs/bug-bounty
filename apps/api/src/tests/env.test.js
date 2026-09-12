import test from "node:test";
import assert from "node:assert/strict";

async function loadEnvConfig(name) {
  return import(`../config/env.js?case=${name}-${Date.now()}`);
}

test("production config requires JWT_SECRET", async () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalJwtSecret = process.env.JWT_SECRET;

  process.env.NODE_ENV = "production";
  delete process.env.JWT_SECRET;

  try {
    await assert.rejects(
      loadEnvConfig("missing-production-secret"),
      /JWT_SECRET is required in production/
    );
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
});

test("development config keeps the local JWT_SECRET fallback", async () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalJwtSecret = process.env.JWT_SECRET;

  process.env.NODE_ENV = "development";
  delete process.env.JWT_SECRET;

  try {
    const { env } = await loadEnvConfig("development-fallback");
    assert.equal(env.jwtSecret, "development-secret");
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
});
