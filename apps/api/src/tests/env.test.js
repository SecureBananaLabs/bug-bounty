import test from "node:test";
import assert from "node:assert/strict";

const envModuleUrl = new URL("../config/env.js", import.meta.url);

async function loadEnvWith(overrides) {
  const keys = ["NODE_ENV", "STRIPE_SECRET_KEY", "DATABASE_URL"];
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

test("development keeps blank database and Stripe config compatible", async () => {
  const { env } = await loadEnvWith({
    NODE_ENV: "development",
    STRIPE_SECRET_KEY: "   ",
    DATABASE_URL: ""
  });

  assert.equal(env.nodeEnv, "development");
  assert.equal(env.stripeSecretKey, "");
  assert.equal(env.databaseUrl, "");
});

test("production rejects a missing Stripe secret", async () => {
  await assert.rejects(
    loadEnvWith({
      NODE_ENV: "production",
      STRIPE_SECRET_KEY: undefined,
      DATABASE_URL: "postgres://db"
    }),
    /STRIPE_SECRET_KEY must be set in production/
  );
});

test("production rejects a blank database URL", async () => {
  await assert.rejects(
    loadEnvWith({
      NODE_ENV: "production",
      STRIPE_SECRET_KEY: "sk_live_123",
      DATABASE_URL: "   "
    }),
    /DATABASE_URL must be set in production/
  );
});

test("production accepts non-blank database and Stripe config", async () => {
  const { env } = await loadEnvWith({
    NODE_ENV: "production",
    STRIPE_SECRET_KEY: "sk_live_123",
    DATABASE_URL: "postgres://db"
  });

  assert.equal(env.nodeEnv, "production");
  assert.equal(env.stripeSecretKey, "sk_live_123");
  assert.equal(env.databaseUrl, "postgres://db");
});
