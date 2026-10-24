import test from "node:test";
import assert from "node:assert/strict";

const ENV_PATH = new URL("../config/env.js", import.meta.url);

async function loadEnvWith(overrides) {
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

    return await import(`${ENV_PATH.href}?t=${Date.now()}-${Math.random()}`);
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

test("uses development fallback when JWT_SECRET is missing outside production", async () => {
  const { env } = await loadEnvWith({ NODE_ENV: "development", JWT_SECRET: undefined });
  assert.equal(env.jwtSecret, "development-secret");
});

test("uses provided JWT_SECRET in production", async () => {
  const { env } = await loadEnvWith({ NODE_ENV: "production", JWT_SECRET: "super-secret" });
  assert.equal(env.jwtSecret, "super-secret");
});

test("throws when JWT_SECRET is missing or blank in production", async () => {
  await assert.rejects(
    () => loadEnvWith({ NODE_ENV: "production", JWT_SECRET: "   " }),
    /JWT_SECRET is required in production/
  );
});
