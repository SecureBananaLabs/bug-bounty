import test from "node:test";
import assert from "node:assert/strict";
import { loadEnv } from "../config/env.js";

test("loadEnv keeps the development JWT fallback outside production", () => {
  const env = loadEnv({ NODE_ENV: "development" });

  assert.equal(env.jwtSecret, "development-secret");
});

test("loadEnv requires JWT_SECRET in production", () => {
  assert.throws(
    () => loadEnv({ NODE_ENV: "production" }),
    /JWT_SECRET must be set in production/
  );
});

test("loadEnv accepts an explicit production JWT_SECRET", () => {
  const env = loadEnv({ NODE_ENV: "production", JWT_SECRET: "prod-secret" });

  assert.equal(env.jwtSecret, "prod-secret");
});
