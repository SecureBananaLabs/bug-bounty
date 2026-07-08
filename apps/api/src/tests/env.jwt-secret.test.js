import test from "node:test";
import assert from "node:assert/strict";

const envModuleUrl = new URL("../config/env.js", import.meta.url);

async function importFreshEnv() {
  return import(`${envModuleUrl.href}?t=${Date.now()}-${Math.random()}`);
}

test("env falls back to development-secret outside production", async () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalJwtSecret = process.env.JWT_SECRET;

  delete process.env.JWT_SECRET;
  process.env.NODE_ENV = "development";

  try {
    const { env } = await importFreshEnv();
    assert.equal(env.jwtSecret, "development-secret");
  } finally {
    process.env.NODE_ENV = originalNodeEnv;
    if (originalJwtSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalJwtSecret;
    }
  }
});

test("env uses configured JWT_SECRET when provided", async () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalJwtSecret = process.env.JWT_SECRET;

  process.env.NODE_ENV = "production";
  process.env.JWT_SECRET = "super-secret";

  try {
    const { env } = await importFreshEnv();
    assert.equal(env.jwtSecret, "super-secret");
  } finally {
    process.env.NODE_ENV = originalNodeEnv;
    if (originalJwtSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalJwtSecret;
    }
  }
});

test("env throws when JWT_SECRET is missing in production", async () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalJwtSecret = process.env.JWT_SECRET;

  process.env.NODE_ENV = "production";
  delete process.env.JWT_SECRET;

  try {
    await assert.rejects(importFreshEnv(), /JWT_SECRET is required in production/);
  } finally {
    process.env.NODE_ENV = originalNodeEnv;
    if (originalJwtSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalJwtSecret;
    }
  }
});
