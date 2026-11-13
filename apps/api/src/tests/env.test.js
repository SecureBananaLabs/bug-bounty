import test from "node:test";
import assert from "node:assert/strict";

const originalNodeEnv = process.env.NODE_ENV;
const originalJwtSecret = process.env.JWT_SECRET;

const restoreEnv = () => {
  if (originalNodeEnv === undefined) {
    delete process.env.NODE_ENV;
  } else {
    process.env.NODE_ENV = originalNodeEnv;
  }

  if (originalJwtSecret === undefined) {
    delete process.env.JWT_SECRET;
  } else {
    process.env.JWT_SECRET = originalJwtSecret;
  }
};

const importFreshEnv = async (name) => {
  return import(`../config/env.js?test=${name}-${Date.now()}-${Math.random()}`);
};

test("env allows the development JWT fallback outside production", async () => {
  delete process.env.NODE_ENV;
  delete process.env.JWT_SECRET;

  try {
    const { env } = await importFreshEnv("development-fallback");
    assert.equal(env.jwtSecret, "development-secret");
  } finally {
    restoreEnv();
  }
});

test("env rejects the development JWT fallback in production", async () => {
  process.env.NODE_ENV = "production";
  delete process.env.JWT_SECRET;

  try {
    await assert.rejects(
      importFreshEnv("production-missing-secret"),
      /JWT_SECRET must be set in production/
    );
  } finally {
    restoreEnv();
  }
});

test("env accepts an explicit JWT secret in production", async () => {
  process.env.NODE_ENV = "production";
  process.env.JWT_SECRET = "prod-secret";

  try {
    const { env } = await importFreshEnv("production-secret");
    assert.equal(env.jwtSecret, "prod-secret");
  } finally {
    restoreEnv();
  }
});
