import test from "node:test";
import assert from "node:assert/strict";

async function importFreshEnv(tag) {
  const url = new URL("../config/env.js", import.meta.url);
  url.searchParams.set("v", tag);
  return import(url.href);
}

async function withEnv(overrides, run) {
  const keys = Object.keys(overrides);
  const previous = new Map(keys.map((key) => [key, Object.prototype.hasOwnProperty.call(process.env, key) ? process.env[key] : undefined]));

  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  try {
    await run();
  } finally {
    for (const key of keys) {
      const value = previous.get(key);
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

test("env keeps the development JWT fallback", async () => {
  await withEnv({ NODE_ENV: undefined, JWT_SECRET: undefined }, async () => {
    const { env } = await importFreshEnv("development-fallback");
    assert.equal(env.nodeEnv, "development");
    assert.equal(env.jwtSecret, "development-secret");
  });
});

test("env keeps the test JWT fallback", async () => {
  await withEnv({ NODE_ENV: "test", JWT_SECRET: undefined }, async () => {
    const { env } = await importFreshEnv("test-fallback");
    assert.equal(env.nodeEnv, "test");
    assert.equal(env.jwtSecret, "development-secret");
  });
});

test("env requires JWT_SECRET outside development and test", async () => {
  await withEnv({ NODE_ENV: "production", JWT_SECRET: undefined }, async () => {
    await assert.rejects(importFreshEnv("production-missing"), /JWT_SECRET must be set outside development and test/);
  });
});

test("env uses the provided JWT_SECRET in production", async () => {
  await withEnv({ NODE_ENV: "production", JWT_SECRET: "prod-secret" }, async () => {
    const { env } = await importFreshEnv("production-present");
    assert.equal(env.nodeEnv, "production");
    assert.equal(env.jwtSecret, "prod-secret");
  });
});
