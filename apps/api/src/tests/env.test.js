import test from "node:test";
import assert from "node:assert/strict";
import { createEnv } from "../config/env.js";

test("uses defaults when NODE_ENV is not production", () => {
  const env = createEnv({});

  assert.equal(env.nodeEnv, "development");
  assert.equal(env.databaseUrl, "");
  assert.equal(env.stripeSecretKey, "");
});

test("uses defaults when NODE_ENV is set to test", () => {
  const env = createEnv({ NODE_ENV: "test" });

  assert.equal(env.databaseUrl, "");
  assert.equal(env.stripeSecretKey, "");
});

test("production requires DATABASE_URL", () => {
  const runProd = () =>
    createEnv({ NODE_ENV: "production", STRIPE_SECRET_KEY: "sk_live" });

  assert.throws(runProd, {
    message: "Missing required production environment variable: DATABASE_URL"
  });
});

test("production requires STRIPE_SECRET_KEY", () => {
  const runProd = () =>
    createEnv({ NODE_ENV: "production", DATABASE_URL: "postgres://db" });

  assert.throws(runProd, {
    message: "Missing required production environment variable: STRIPE_SECRET_KEY"
  });
});

test("production rejects blank DATABASE_URL values", () => {
  const runProd = () =>
    createEnv({
      NODE_ENV: "production",
      DATABASE_URL: "   ",
      STRIPE_SECRET_KEY: "sk_live"
    });

  assert.throws(runProd, {
    message: "Missing required production environment variable: DATABASE_URL"
  });
});

test("production rejects blank STRIPE_SECRET_KEY values", () => {
  const runProd = () =>
    createEnv({
      NODE_ENV: "production",
      DATABASE_URL: "postgres://db",
      STRIPE_SECRET_KEY: "\t\n"
    });

  assert.throws(runProd, {
    message: "Missing required production environment variable: STRIPE_SECRET_KEY"
  });
});

test("production accepts explicit production config values", () => {
  const env = createEnv({
    NODE_ENV: "production",
    PORT: "8123",
    DATABASE_URL: "postgres://db",
    STRIPE_SECRET_KEY: "sk_live"
  });

  assert.equal(env.nodeEnv, "production");
  assert.equal(env.port, 8123);
  assert.equal(env.databaseUrl, "postgres://db");
  assert.equal(env.stripeSecretKey, "sk_live");
});
