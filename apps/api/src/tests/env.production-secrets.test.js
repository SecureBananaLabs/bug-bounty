import test from "node:test";
import assert from "node:assert/strict";

const envModuleUrl = new URL("../config/env.js", import.meta.url).href;

async function loadEnv(overrides) {
  const original = {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY
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

test("env keeps database and Stripe secrets optional outside production", async () => {
  const { env } = await loadEnv({
    NODE_ENV: "test",
    DATABASE_URL: undefined,
    STRIPE_SECRET_KEY: undefined
  });

  assert.equal(env.databaseUrl, "");
  assert.equal(env.stripeSecretKey, "");
});

test("env throws when DATABASE_URL is blank in production", async () => {
  await assert.rejects(
    () =>
      loadEnv({
        NODE_ENV: "production",
        DATABASE_URL: "   ",
        STRIPE_SECRET_KEY: "sk_test_123"
      }),
    /DATABASE_URL must be set in production/
  );
});

test("env throws when STRIPE_SECRET_KEY is blank in production", async () => {
  await assert.rejects(
    () =>
      loadEnv({
        NODE_ENV: "production",
        DATABASE_URL: "postgres://db",
        STRIPE_SECRET_KEY: "   "
      }),
    /STRIPE_SECRET_KEY must be set in production/
  );
});
