import assert from "node:assert/strict";
import test from "node:test";

const originalEnv = {
  DATABASE_URL: process.env.DATABASE_URL,
  NODE_ENV: process.env.NODE_ENV,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY
};

test.afterEach(() => {
  restoreEnv();
});

function restoreEnv() {
  for (const [name, value] of Object.entries(originalEnv)) {
    if (value === undefined) {
      delete process.env[name];
    } else {
      process.env[name] = value;
    }
  }
}

function applyEnv(overrides) {
  for (const [name, value] of Object.entries(overrides)) {
    if (value === undefined) {
      delete process.env[name];
    } else {
      process.env[name] = value;
    }
  }
}

async function loadEnv(overrides) {
  restoreEnv();
  applyEnv(overrides);

  const url = new URL("../config/env.js", import.meta.url);
  url.searchParams.set("case", `${Date.now()}-${Math.random()}`);
  return import(url.href);
}

test("production config rejects a missing database URL", async () => {
  await assert.rejects(
    () =>
      loadEnv({
        DATABASE_URL: "",
        NODE_ENV: "production",
        STRIPE_SECRET_KEY: "sk_test_configured"
      }),
    /Missing required environment variable: DATABASE_URL/
  );
});

test("production config rejects a blank Stripe secret", async () => {
  await assert.rejects(
    () =>
      loadEnv({
        DATABASE_URL: "postgres://user:pass@localhost:5432/app",
        NODE_ENV: "production",
        STRIPE_SECRET_KEY: "   "
      }),
    /Missing required environment variable: STRIPE_SECRET_KEY/
  );
});

test("production config accepts nonblank required variables", async () => {
  const { env } = await loadEnv({
    DATABASE_URL: "postgres://user:pass@localhost:5432/app",
    NODE_ENV: "production",
    STRIPE_SECRET_KEY: "sk_test_configured"
  });

  assert.equal(env.databaseUrl, "postgres://user:pass@localhost:5432/app");
  assert.equal(env.stripeSecretKey, "sk_test_configured");
});

test("test config keeps existing empty defaults for lightweight imports", async () => {
  const { env } = await loadEnv({
    DATABASE_URL: undefined,
    NODE_ENV: "test",
    STRIPE_SECRET_KEY: undefined
  });

  assert.equal(env.databaseUrl, "");
  assert.equal(env.stripeSecretKey, "");
});
