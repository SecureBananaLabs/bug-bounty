import test from "node:test";
import assert from "node:assert/strict";
import { loadEnv } from "../config/env.js";

test("loadEnv falls back to development JWT secret outside production", () => {
  const env = loadEnv({
    NODE_ENV: "development",
    PORT: "4000"
  });

  assert.equal(env.jwtSecret, "development-secret");
  assert.equal(env.nodeEnv, "development");
});

test("loadEnv uses configured JWT secret when provided", () => {
  const env = loadEnv({
    NODE_ENV: "production",
    JWT_SECRET: "super-secret",
    PORT: "4000"
  });

  assert.equal(env.jwtSecret, "super-secret");
  assert.equal(env.nodeEnv, "production");
});

test("loadEnv throws when production JWT secret is missing", () => {
  assert.throws(
    () =>
      loadEnv({
        NODE_ENV: "production",
        PORT: "4000"
      }),
    /JWT_SECRET is required in production/
  );
});
