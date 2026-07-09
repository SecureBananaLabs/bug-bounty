import assert from "node:assert/strict";
import { test } from "node:test";

const originalEnv = {
  NODE_ENV: process.env.NODE_ENV,
  JWT_SECRET: process.env.JWT_SECRET
};

function setEnvValue(name, value) {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}

async function withEnv(values, callback) {
  setEnvValue("NODE_ENV", values.NODE_ENV);
  setEnvValue("JWT_SECRET", values.JWT_SECRET);

  try {
    return await callback();
  } finally {
    setEnvValue("NODE_ENV", originalEnv.NODE_ENV);
    setEnvValue("JWT_SECRET", originalEnv.JWT_SECRET);
  }
}

function importFreshEnv(name) {
  return import(`../config/env.js?case=${name}-${Date.now()}-${Math.random()}`);
}

test("env keeps the local development JWT secret fallback", async () => {
  await withEnv({ NODE_ENV: undefined, JWT_SECRET: undefined }, async () => {
    const { env } = await importFreshEnv("development-fallback");

    assert.equal(env.nodeEnv, "development");
    assert.equal(env.jwtSecret, "development-secret");
  });
});

test("env requires JWT_SECRET in production", async () => {
  await withEnv({ NODE_ENV: "production", JWT_SECRET: undefined }, async () => {
    await assert.rejects(
      importFreshEnv("production-missing-secret"),
      /JWT_SECRET is required in production/
    );
  });
});

test("env accepts an explicit production JWT secret", async () => {
  await withEnv({ NODE_ENV: "production", JWT_SECRET: "prod-secret" }, async () => {
    const { env } = await importFreshEnv("production-secret");

    assert.equal(env.nodeEnv, "production");
    assert.equal(env.jwtSecret, "prod-secret");
  });
});
