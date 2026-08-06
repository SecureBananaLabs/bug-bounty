import test from "node:test";
import assert from "node:assert/strict";
import { loadEnv } from "../config/env.js";

test("loadEnv keeps the development JWT fallback for local runs", () => {
  const env = loadEnv({ NODE_ENV: "development" });

  assert.equal(env.nodeEnv, "development");
  assert.equal(env.jwtSecret, "development-secret");
});

test("loadEnv rejects missing JWT_SECRET in production", () => {
  assert.throws(
    () => loadEnv({ NODE_ENV: "production" }),
    /JWT_SECRET is required in production/
  );
});

test("loadEnv preserves a provided production JWT_SECRET", () => {
  const env = loadEnv({
    NODE_ENV: "production",
    JWT_SECRET: "prod-secret",
    PORT: "8080"
  });

  assert.equal(env.nodeEnv, "production");
  assert.equal(env.jwtSecret, "prod-secret");
  assert.equal(env.port, 8080);
});
