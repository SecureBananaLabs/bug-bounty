import test from "node:test";
import assert from "node:assert/strict";

const envModuleUrl = new URL("../config/env.js", import.meta.url);

async function loadEnvWith(overrides) {
  const previous = {
    NODE_ENV: process.env.NODE_ENV,
    JWT_SECRET: process.env.JWT_SECRET
  };

  if (overrides.NODE_ENV === undefined) {
    delete process.env.NODE_ENV;
  } else {
    process.env.NODE_ENV = overrides.NODE_ENV;
  }

  if (overrides.JWT_SECRET === undefined) {
    delete process.env.JWT_SECRET;
  } else {
    process.env.JWT_SECRET = overrides.JWT_SECRET;
  }

  try {
    return await import(`${envModuleUrl.href}?t=${Date.now()}-${Math.random()}`);
  } finally {
    if (previous.NODE_ENV === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = previous.NODE_ENV;
    }

    if (previous.JWT_SECRET === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = previous.JWT_SECRET;
    }
  }
}

test("development keeps the fallback JWT secret", async () => {
  const { env } = await loadEnvWith({
    NODE_ENV: "development",
    JWT_SECRET: undefined
  });

  assert.equal(env.nodeEnv, "development");
  assert.equal(env.jwtSecret, "development-secret");
});

test("production rejects a missing JWT secret", async () => {
  await assert.rejects(
    loadEnvWith({
      NODE_ENV: "production",
      JWT_SECRET: undefined
    }),
    /JWT_SECRET must be set to a non-default value in production/
  );
});

test("production rejects the default JWT secret value", async () => {
  await assert.rejects(
    loadEnvWith({
      NODE_ENV: "production",
      JWT_SECRET: "development-secret"
    }),
    /JWT_SECRET must be set to a non-default value in production/
  );
});

test("production accepts a non-default JWT secret", async () => {
  const { env } = await loadEnvWith({
    NODE_ENV: "production",
    JWT_SECRET: "super-secret-prod-key"
  });

  assert.equal(env.nodeEnv, "production");
  assert.equal(env.jwtSecret, "super-secret-prod-key");
});
