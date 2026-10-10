import test from "node:test";
import assert from "node:assert/strict";

const ORIGINAL_ENV = { ...process.env };
let importCounter = 0;

async function importEnv(overrides = {}) {
  process.env = { ...ORIGINAL_ENV, ...overrides };

  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) {
      delete process.env[key];
    }
  }

  importCounter += 1;
  return import(`../config/env.js?case=${importCounter}`);
}

test.afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

test("production requires JWT_SECRET to be set", async () => {
  await assert.rejects(
    importEnv({ NODE_ENV: "production", JWT_SECRET: undefined }),
    /JWT_SECRET must be set to at least 32 characters in production/
  );
});

test("production rejects blank JWT_SECRET", async () => {
  await assert.rejects(
    importEnv({ NODE_ENV: "production", JWT_SECRET: "   " }),
    /JWT_SECRET must be set to at least 32 characters in production/
  );
});

test("production rejects short JWT_SECRET", async () => {
  await assert.rejects(
    importEnv({ NODE_ENV: "production", JWT_SECRET: "too-short" }),
    /JWT_SECRET must be set to at least 32 characters in production/
  );
});

test("production accepts a strong JWT_SECRET", async () => {
  const { env } = await importEnv({
    NODE_ENV: "production",
    JWT_SECRET: "12345678901234567890123456789012"
  });

  assert.equal(env.jwtSecret, "12345678901234567890123456789012");
});

test("non-production keeps the development JWT_SECRET fallback", async () => {
  const { env } = await importEnv({ NODE_ENV: "test", JWT_SECRET: undefined });

  assert.equal(env.jwtSecret, "development-secret");
});
