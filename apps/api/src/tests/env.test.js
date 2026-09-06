import test from "node:test";
import assert from "node:assert/strict";
import { loadEnv } from "../config/env.js";

const requiredEnv = {
  DATABASE_URL: "postgresql://localhost/freelanceflow",
  STRIPE_SECRET_KEY: "sk_test_replace_me"
};

test("loadEnv keeps the development JWT fallback", () => {
  const env = loadEnv({ NODE_ENV: "development" });

  assert.equal(env.jwtSecret, "development-secret");
});

test("loadEnv requires JWT_SECRET outside development", () => {
  assert.throws(
    () => loadEnv({ NODE_ENV: "production", ...requiredEnv }),
    /JWT_SECRET is required outside development/
  );
});

test("loadEnv accepts JWT_SECRET outside development", () => {
  const env = loadEnv({
    NODE_ENV: "production",
    JWT_SECRET: "replace-me-with-a-real-secret",
    ...requiredEnv
  });

  assert.equal(env.jwtSecret, "replace-me-with-a-real-secret");
});

test("loadEnv requires DATABASE_URL", () => {
  assert.throws(
    () => loadEnv({ NODE_ENV: "production", JWT_SECRET: "replace-me-with-a-real-secret", STRIPE_SECRET_KEY: "sk_test_replace_me" }),
    /DATABASE_URL is required/
  );
});

test("loadEnv rejects blank DATABASE_URL", () => {
  assert.throws(
    () => loadEnv({ NODE_ENV: "production", JWT_SECRET: "replace-me-with-a-real-secret", DATABASE_URL: "  ", STRIPE_SECRET_KEY: "sk_test_replace_me" }),
    /DATABASE_URL is required/
  );
});

test("loadEnv requires STRIPE_SECRET_KEY", () => {
  assert.throws(
    () => loadEnv({ NODE_ENV: "production", JWT_SECRET: "replace-me-with-a-real-secret", DATABASE_URL: "postgresql://localhost/freelanceflow" }),
    /STRIPE_SECRET_KEY is required/
  );
});

test("loadEnv rejects blank STRIPE_SECRET_KEY", () => {
  assert.throws(
    () => loadEnv({ NODE_ENV: "production", JWT_SECRET: "replace-me-with-a-real-secret", DATABASE_URL: "postgresql://localhost/freelanceflow", STRIPE_SECRET_KEY: "\t" }),
    /STRIPE_SECRET_KEY is required/
  );
});
