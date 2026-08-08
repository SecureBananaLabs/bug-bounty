import test from "node:test";
import assert from "node:assert/strict";

async function importFreshEnv(label) {
  return import(`../config/env.js?case=${label}-${Date.now()}-${Math.random()}`);
}

async function withProcessEnv(overrides, fn) {
  const previous = {};

  for (const key of Object.keys(overrides)) {
    previous[key] = process.env[key];
    const value = overrides[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  try {
    return await fn();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

test("uses the local development JWT fallback outside production", async () => {
  await withProcessEnv({ NODE_ENV: "development", JWT_SECRET: undefined }, async () => {
    const { env } = await importFreshEnv("development-fallback");

    assert.equal(env.jwtSecret, "development-secret");
  });
});

test("rejects production startup without JWT_SECRET", async () => {
  await withProcessEnv({ NODE_ENV: "production", JWT_SECRET: undefined }, async () => {
    await assert.rejects(
      importFreshEnv("production-missing-secret"),
      /JWT_SECRET is required when NODE_ENV=production/
    );
  });
});

test("uses explicit JWT_SECRET in production", async () => {
  await withProcessEnv({ NODE_ENV: "production", JWT_SECRET: "configured-secret" }, async () => {
    const { env } = await importFreshEnv("production-configured-secret");

    assert.equal(env.jwtSecret, "configured-secret");
  });
});
