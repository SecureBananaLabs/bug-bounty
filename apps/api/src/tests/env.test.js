import test from "node:test";
import assert from "node:assert/strict";
const envModuleUrl = new URL("../config/env.js", import.meta.url).href;

async function loadEnv(overrides) {
  const original = {
    NODE_ENV: process.env.NODE_ENV,
    JWT_SECRET: process.env.JWT_SECRET
  };

  try {
    for (const [key, value] of Object.entries(overrides)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }

    return await import(`${envModuleUrl}?case=${Date.now()}-${Math.random()}`);
  } finally {
    for (const [key, value] of Object.entries(original)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

test("env uses development JWT fallback outside production", async () => {
  const { env } = await loadEnv({
    NODE_ENV: "development",
    JWT_SECRET: undefined
  });

  assert.equal(env.jwtSecret, "development-secret");
});

test("env uses configured JWT secret when provided", async () => {
  const { env } = await loadEnv({
    NODE_ENV: "production",
    JWT_SECRET: "super-secret"
  });

  assert.equal(env.jwtSecret, "super-secret");
});

test("env throws when JWT_SECRET is missing in production", async () => {
  await assert.rejects(
    () =>
      loadEnv({
        NODE_ENV: "production",
        JWT_SECRET: "   "
      }),
    /JWT_SECRET must be set in production/
  );
});
