import test from "node:test";
import assert from "node:assert/strict";

async function importEnvWith(overrides) {
  const previous = {
    NODE_ENV: process.env.NODE_ENV,
    JWT_SECRET: process.env.JWT_SECRET
  };

  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  try {
    const moduleUrl = new URL(`../config/env.js?case=${Date.now()}-${Math.random()}`, import.meta.url);
    return await import(moduleUrl.href);
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

test("production config rejects missing JWT_SECRET", async () => {
  await assert.rejects(
    () => importEnvWith({ NODE_ENV: "production", JWT_SECRET: undefined }),
    /JWT_SECRET is required in production/
  );
});

test("production config rejects blank JWT_SECRET", async () => {
  await assert.rejects(
    () => importEnvWith({ NODE_ENV: "production", JWT_SECRET: "   " }),
    /JWT_SECRET is required in production/
  );
});

test("development config keeps JWT_SECRET fallback", async () => {
  const { env } = await importEnvWith({ NODE_ENV: "development", JWT_SECRET: undefined });

  assert.equal(env.jwtSecret, "development-secret");
});
