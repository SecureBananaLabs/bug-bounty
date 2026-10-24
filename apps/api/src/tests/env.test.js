import test from "node:test";
import assert from "node:assert/strict";

const ORIGINAL_NODE_ENV = process.env.NODE_ENV;
const ORIGINAL_JWT_SECRET = process.env.JWT_SECRET;

async function loadEnvForCase(name) {
  return import(`../config/env.js?case=${name}-${Date.now()}-${Math.random()}`);
}

test.afterEach(() => {
  if (ORIGINAL_NODE_ENV === undefined) {
    delete process.env.NODE_ENV;
  } else {
    process.env.NODE_ENV = ORIGINAL_NODE_ENV;
  }

  if (ORIGINAL_JWT_SECRET === undefined) {
    delete process.env.JWT_SECRET;
  } else {
    process.env.JWT_SECRET = ORIGINAL_JWT_SECRET;
  }
});

test("uses development JWT secret fallback only in development", async () => {
  process.env.NODE_ENV = "development";
  delete process.env.JWT_SECRET;

  const { env } = await loadEnvForCase("development-fallback");

  assert.equal(env.jwtSecret, "development-secret");
});

test("requires JWT_SECRET outside development", async () => {
  process.env.NODE_ENV = "production";
  delete process.env.JWT_SECRET;

  await assert.rejects(
    loadEnvForCase("production-missing-secret"),
    /JWT_SECRET is required outside development/
  );
});

test("uses supplied JWT_SECRET outside development", async () => {
  process.env.NODE_ENV = "production";
  process.env.JWT_SECRET = "production-secret";

  const { env } = await loadEnvForCase("production-secret");

  assert.equal(env.jwtSecret, "production-secret");
});
