import test from "node:test";
import assert from "node:assert/strict";

const originalNodeEnv = process.env.NODE_ENV;
const originalJwtSecret = process.env.JWT_SECRET;

function restoreEnv() {
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
}

async function loadEnvForTest() {
  return import("../config/env.js?test=" + Date.now() + Math.random());
}

test("env uses development JWT secret fallback outside production", async (t) => {
  t.after(restoreEnv);
  process.env.NODE_ENV = "development";
  delete process.env.JWT_SECRET;

  const { env } = await loadEnvForTest();

  assert.equal(env.jwtSecret, "development-secret");
});

test("env uses configured JWT secret when provided", async (t) => {
  t.after(restoreEnv);
  process.env.NODE_ENV = "production";
  process.env.JWT_SECRET = "configured-secret";

  const { env } = await loadEnvForTest();

  assert.equal(env.jwtSecret, "configured-secret");
});

test("env rejects missing JWT_SECRET in production", async (t) => {
  t.after(restoreEnv);
  process.env.NODE_ENV = "production";
  delete process.env.JWT_SECRET;

  await assert.rejects(loadEnvForTest(), /JWT_SECRET is required in production/);
});
