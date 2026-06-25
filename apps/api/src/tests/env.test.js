import test from "node:test";
import assert from "node:assert/strict";
import { createEnv } from "../config/env.js";

test("createEnv uses development JWT fallback outside production", () => {
  const env = createEnv({ NODE_ENV: "development" });

  assert.equal(env.nodeEnv, "development");
  assert.equal(env.jwtSecret, "development-secret");
});

test("createEnv uses configured JWT secret in production", () => {
  const env = createEnv({
    NODE_ENV: "production",
    JWT_SECRET: "configured-production-secret"
  });

  assert.equal(env.nodeEnv, "production");
  assert.equal(env.jwtSecret, "configured-production-secret");
});

test("createEnv fails fast when production JWT secret is missing", () => {
  assert.throws(
    () => createEnv({ NODE_ENV: "production" }),
    /JWT_SECRET is required in production/
  );
});
