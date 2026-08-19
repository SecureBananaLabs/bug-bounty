import assert from "node:assert/strict";
import test from "node:test";

const ORIGINAL_ENV = {
  DATABASE_URL: process.env.DATABASE_URL,
  NODE_ENV: process.env.NODE_ENV,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY
};

let importCounter = 0;

function setEnv({ databaseUrl, nodeEnv, stripeSecretKey }) {
  if (nodeEnv === undefined) {
    delete process.env.NODE_ENV;
  } else {
    process.env.NODE_ENV = nodeEnv;
  }

  if (databaseUrl === undefined) {
    delete process.env.DATABASE_URL;
  } else {
    process.env.DATABASE_URL = databaseUrl;
  }

  if (stripeSecretKey === undefined) {
    delete process.env.STRIPE_SECRET_KEY;
  } else {
    process.env.STRIPE_SECRET_KEY = stripeSecretKey;
  }
}

function restoreEnv() {
  setEnv({
    databaseUrl: ORIGINAL_ENV.DATABASE_URL,
    nodeEnv: ORIGINAL_ENV.NODE_ENV,
    stripeSecretKey: ORIGINAL_ENV.STRIPE_SECRET_KEY
  });
}

async function importFreshEnv() {
  importCounter += 1;
  return import(`../config/env.js?case=${importCounter}`);
}

test.afterEach(() => {
  restoreEnv();
});

test("development imports allow missing database and Stripe config", async () => {
  setEnv({ databaseUrl: undefined, nodeEnv: "development", stripeSecretKey: undefined });

  const { env } = await importFreshEnv();

  assert.equal(env.databaseUrl, "");
  assert.equal(env.stripeSecretKey, "");
});

test("test imports allow missing database and Stripe config", async () => {
  setEnv({ databaseUrl: undefined, nodeEnv: "test", stripeSecretKey: undefined });

  const { env } = await importFreshEnv();

  assert.equal(env.databaseUrl, "");
  assert.equal(env.stripeSecretKey, "");
});

test("production rejects missing database config", async () => {
  setEnv({ databaseUrl: undefined, nodeEnv: "production", stripeSecretKey: "sk_live_test" });

  await assert.rejects(importFreshEnv(), /DATABASE_URL must be set in production/);
});

test("production rejects blank database config", async () => {
  setEnv({ databaseUrl: "   ", nodeEnv: "production", stripeSecretKey: "sk_live_test" });

  await assert.rejects(importFreshEnv(), /DATABASE_URL must be set in production/);
});

test("production rejects missing Stripe config", async () => {
  setEnv({ databaseUrl: "postgres://localhost/app", nodeEnv: "production", stripeSecretKey: undefined });

  await assert.rejects(importFreshEnv(), /STRIPE_SECRET_KEY must be set in production/);
});

test("production rejects blank Stripe config", async () => {
  setEnv({ databaseUrl: "postgres://localhost/app", nodeEnv: "production", stripeSecretKey: "\t" });

  await assert.rejects(importFreshEnv(), /STRIPE_SECRET_KEY must be set in production/);
});

test("production accepts nonblank database and Stripe config", async () => {
  setEnv({
    databaseUrl: "postgres://localhost/app",
    nodeEnv: "production",
    stripeSecretKey: "sk_live_test"
  });

  const { env } = await importFreshEnv();

  assert.equal(env.databaseUrl, "postgres://localhost/app");
  assert.equal(env.stripeSecretKey, "sk_live_test");
});
