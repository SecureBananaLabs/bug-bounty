import test from "node:test";
import assert from "node:assert/strict";

const envModuleUrl = new URL("../config/env.js", import.meta.url);
const trackedEnvKeys = ["NODE_ENV", "STRIPE_SECRET_KEY", "DATABASE_URL"];

async function loadEnv(overrides) {
  const previousValues = Object.fromEntries(
    trackedEnvKeys.map((key) => [key, process.env[key]])
  );

  for (const key of trackedEnvKeys) {
    if (Object.hasOwn(overrides, key)) {
      const value = overrides[key];

      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }

  try {
    return await import(`${envModuleUrl.href}?case=${Date.now()}-${Math.random()}`);
  } finally {
    for (const key of trackedEnvKeys) {
      if (previousValues[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = previousValues[key];
      }
    }
  }
}

test("development keeps blank database and Stripe config compatible", async () => {
  const { env } = await loadEnv({
    NODE_ENV: "development",
    STRIPE_SECRET_KEY: "",
    DATABASE_URL: "   "
  });

  assert.equal(env.nodeEnv, "development");
  assert.equal(env.stripeSecretKey, "");
  assert.equal(env.databaseUrl, "   ");
});

test("test imports keep missing database and Stripe config compatible", async () => {
  const { env } = await loadEnv({
    NODE_ENV: "test",
    STRIPE_SECRET_KEY: undefined,
    DATABASE_URL: undefined
  });

  assert.equal(env.nodeEnv, "test");
  assert.equal(env.stripeSecretKey, "");
  assert.equal(env.databaseUrl, "");
});

test("production rejects a missing database URL", async () => {
  await assert.rejects(
    loadEnv({
      NODE_ENV: "production",
      STRIPE_SECRET_KEY: "sk_live_123",
      DATABASE_URL: undefined
    }),
    /DATABASE_URL must be set in production/
  );
});

test("production rejects a blank database URL", async () => {
  await assert.rejects(
    loadEnv({
      NODE_ENV: "production",
      STRIPE_SECRET_KEY: "sk_live_123",
      DATABASE_URL: "   "
    }),
    /DATABASE_URL must be set in production/
  );
});

test("production rejects a missing Stripe secret", async () => {
  await assert.rejects(
    loadEnv({
      NODE_ENV: "production",
      STRIPE_SECRET_KEY: undefined,
      DATABASE_URL: "postgres://db"
    }),
    /STRIPE_SECRET_KEY must be set in production/
  );
});

test("production rejects a blank Stripe secret", async () => {
  await assert.rejects(
    loadEnv({
      NODE_ENV: "production",
      STRIPE_SECRET_KEY: "   ",
      DATABASE_URL: "postgres://db"
    }),
    /STRIPE_SECRET_KEY must be set in production/
  );
});

test("production accepts non-blank database and Stripe config", async () => {
  const { env } = await loadEnv({
    NODE_ENV: "production",
    STRIPE_SECRET_KEY: "sk_live_123",
    DATABASE_URL: "postgres://db"
  });

  assert.equal(env.nodeEnv, "production");
  assert.equal(env.stripeSecretKey, "sk_live_123");
  assert.equal(env.databaseUrl, "postgres://db");
});
