import test from "node:test";
import assert from "node:assert/strict";

const envModuleUrl = new URL("../config/env.js", import.meta.url);

test("loadEnv keeps the development JWT fallback outside production", async () => {
  const { loadEnv } = await importFreshEnvModule();

  const env = loadEnv({ NODE_ENV: "development" });

  assert.equal(env.nodeEnv, "development");
  assert.equal(env.jwtSecret, "development-secret");
});

test("loadEnv rejects a missing production JWT secret", async () => {
  const { loadEnv } = await importFreshEnvModule();

  assert.throws(
    () => loadEnv({ NODE_ENV: "production" }),
    /JWT_SECRET must be set to a non-development value in production/
  );
});

test("loadEnv rejects the development JWT secret in production", async () => {
  const { loadEnv } = await importFreshEnvModule();

  assert.throws(
    () => loadEnv({ NODE_ENV: "production", JWT_SECRET: "development-secret" }),
    /JWT_SECRET must be set to a non-development value in production/
  );
});

test("loadEnv accepts a non-default production JWT secret", async () => {
  const { loadEnv } = await importFreshEnvModule();

  const env = loadEnv({ NODE_ENV: "production", JWT_SECRET: "prod-secret-value" });

  assert.equal(env.jwtSecret, "prod-secret-value");
});

test("module initialization rejects unsafe production environment", async () => {
  await withProcessEnv({ NODE_ENV: "production" }, async () => {
    await assert.rejects(
      () => importFreshEnvModule(),
      /JWT_SECRET must be set to a non-development value in production/
    );
  });
});

async function importFreshEnvModule() {
  return import(`${envModuleUrl.href}?case=${Date.now()}-${Math.random()}`);
}

async function withProcessEnv(overrides, callback) {
  const original = {
    NODE_ENV: process.env.NODE_ENV,
    JWT_SECRET: process.env.JWT_SECRET
  };

  delete process.env.NODE_ENV;
  delete process.env.JWT_SECRET;
  Object.assign(process.env, overrides);

  try {
    await callback();
  } finally {
    restoreEnvValue("NODE_ENV", original.NODE_ENV);
    restoreEnvValue("JWT_SECRET", original.JWT_SECRET);
  }
}

function restoreEnvValue(key, value) {
  if (value === undefined) {
    delete process.env[key];
    return;
  }
  process.env[key] = value;
}
