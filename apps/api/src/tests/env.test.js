import test from "node:test";
import assert from "node:assert/strict";

const originalNodeEnv = process.env.NODE_ENV;
const originalJwtSecret = process.env.JWT_SECRET;
let importCounter = 0;

function setEnvValue(name, value) {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}

async function withEnv(overrides, callback) {
  setEnvValue("NODE_ENV", overrides.NODE_ENV);
  setEnvValue("JWT_SECRET", overrides.JWT_SECRET);

  try {
    return await callback();
  } finally {
    setEnvValue("NODE_ENV", originalNodeEnv);
    setEnvValue("JWT_SECRET", originalJwtSecret);
  }
}

async function importFreshEnv() {
  importCounter += 1;
  return import(`../config/env.js?test=${importCounter}`);
}

test("non-production config uses local JWT fallback when secret is missing", async () => {
  await withEnv({ NODE_ENV: "development", JWT_SECRET: undefined }, async () => {
    const { env } = await importFreshEnv();

    assert.equal(env.nodeEnv, "development");
    assert.equal(env.jwtSecret, "development-secret");
  });
});

test("production config rejects missing JWT secret", async () => {
  await withEnv({ NODE_ENV: "production", JWT_SECRET: undefined }, async () => {
    await assert.rejects(importFreshEnv, /JWT_SECRET is required in production/);
  });
});

test("production config rejects blank JWT secret", async () => {
  await withEnv({ NODE_ENV: "production", JWT_SECRET: "   " }, async () => {
    await assert.rejects(importFreshEnv, /JWT_SECRET is required in production/);
  });
});

test("production config preserves provided JWT secret", async () => {
  await withEnv({ NODE_ENV: "production", JWT_SECRET: "prod-secret-value" }, async () => {
    const { env } = await importFreshEnv();

    assert.equal(env.nodeEnv, "production");
    assert.equal(env.jwtSecret, "prod-secret-value");
  });
});
