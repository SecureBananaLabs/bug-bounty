import test from "node:test";
import assert from "node:assert/strict";

const originalEnv = {
  NODE_ENV: process.env.NODE_ENV,
  JWT_SECRET: process.env.JWT_SECRET
};

async function loadEnvModule() {
  const nonce = `${Date.now()}-${Math.random()}`;
  return import(`../config/env.js?test=${nonce}`);
}

test.after(() => {
  if (originalEnv.NODE_ENV === undefined) {
    delete process.env.NODE_ENV;
  } else {
    process.env.NODE_ENV = originalEnv.NODE_ENV;
  }

  if (originalEnv.JWT_SECRET === undefined) {
    delete process.env.JWT_SECRET;
  } else {
    process.env.JWT_SECRET = originalEnv.JWT_SECRET;
  }
});

test("env keeps the development fallback secret", async () => {
  process.env.NODE_ENV = "development";
  delete process.env.JWT_SECRET;

  const { env } = await loadEnvModule();

  assert.equal(env.nodeEnv, "development");
  assert.equal(env.jwtSecret, "development-secret");
});

test("env rejects missing JWT secret outside development", async () => {
  process.env.NODE_ENV = "production";
  delete process.env.JWT_SECRET;

  await assert.rejects(loadEnvModule(), /JWT_SECRET is required outside development/);
});

test("env accepts explicit JWT secret outside development", async () => {
  process.env.NODE_ENV = "production";
  process.env.JWT_SECRET = "super-secret";

  const { env } = await loadEnvModule();

  assert.equal(env.nodeEnv, "production");
  assert.equal(env.jwtSecret, "super-secret");
});
