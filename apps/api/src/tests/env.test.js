import test from "node:test";
import assert from "node:assert/strict";

const envModuleUrl = new URL("../config/env.js", import.meta.url);

async function loadEnvWith(overrides) {
  const keys = ["NODE_ENV", "JWT_SECRET"];
  const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]));

  for (const key of keys) {
    const value = overrides[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  try {
    return await import(`${envModuleUrl.href}?t=${Date.now()}-${Math.random()}`);
  } finally {
    for (const key of keys) {
      if (previous[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = previous[key];
      }
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
    /JWT_SECRET must be at least 32 characters in production/
  );
});

test("production rejects a blank JWT secret", async () => {
  await assert.rejects(
    loadEnvWith({
      NODE_ENV: "production",
      JWT_SECRET: "   "
    }),
    /JWT_SECRET must be at least 32 characters in production/
  );
});

test("production rejects a short JWT secret", async () => {
  await assert.rejects(
    loadEnvWith({
      NODE_ENV: "production",
      JWT_SECRET: "short-secret"
    }),
    /JWT_SECRET must be at least 32 characters in production/
  );
});

test("production accepts a long enough JWT secret", async () => {
  const { env } = await loadEnvWith({
    NODE_ENV: "production",
    JWT_SECRET: "12345678901234567890123456789012"
  });

  assert.equal(env.nodeEnv, "production");
  assert.equal(env.jwtSecret, "12345678901234567890123456789012");
});
