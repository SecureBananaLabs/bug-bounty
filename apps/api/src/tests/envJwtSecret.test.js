import test from "node:test";
import assert from "node:assert/strict";

const originalNodeEnv = process.env.NODE_ENV;
const originalJwtSecret = process.env.JWT_SECRET;

async function loadEnv(overrides) {
  if ("NODE_ENV" in overrides) {
    if (overrides.NODE_ENV === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = overrides.NODE_ENV;
    }
  }

  if ("JWT_SECRET" in overrides) {
    if (overrides.JWT_SECRET === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = overrides.JWT_SECRET;
    }
  }

  return import(`../config/env.js?case=${crypto.randomUUID()}`);
}

function restoreEnv() {
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

test.afterEach(() => {
  restoreEnv();
});

test("development uses fallback JWT secret when JWT_SECRET is missing", async () => {
  const { env } = await loadEnv({
    NODE_ENV: "development",
    JWT_SECRET: undefined
  });

  assert.equal(env.jwtSecret, "development-secret");
});

test("production requires JWT_SECRET", async () => {
  await assert.rejects(
    () => loadEnv({
      NODE_ENV: "production",
      JWT_SECRET: undefined
    }),
    /JWT_SECRET is required outside development/
  );
});

test("production accepts explicit JWT_SECRET", async () => {
  const { env } = await loadEnv({
    NODE_ENV: "production",
    JWT_SECRET: "safe-secret"
  });

  assert.equal(env.jwtSecret, "safe-secret");
});
