import test from "node:test";
import assert from "node:assert/strict";
import { validateEnv } from "../config/env.js";

test("validateEnv succeeds in development with default secret", () => {
  const result = validateEnv({ NODE_ENV: "development" });
  assert.equal(result.nodeEnv, "development");
  assert.equal(result.jwtSecret, "development-secret");
});

test("validateEnv throws in production when JWT_SECRET is missing", () => {
  assert.throws(
    () => validateEnv({ NODE_ENV: "production" }),
    /JWT_SECRET must be explicitly set/
  );
});

test("validateEnv throws in production when JWT_SECRET is development-secret", () => {
  assert.throws(
    () => validateEnv({ NODE_ENV: "production", JWT_SECRET: "development-secret" }),
    /JWT_SECRET must be explicitly set/
  );
});

test("validateEnv throws in production when JWT_SECRET is under 32 chars", () => {
  assert.throws(
    () => validateEnv({ NODE_ENV: "production", JWT_SECRET: "short-secret" }),
    /JWT_SECRET must be explicitly set with at least 32 characters/
  );
});

test("validateEnv succeeds in production with strong 32+ char secret", () => {
  const strongSecret = "a_very_strong_production_secret_32chars_long!";
  const result = validateEnv({ NODE_ENV: "production", JWT_SECRET: strongSecret });
  assert.equal(result.nodeEnv, "production");
  assert.equal(result.jwtSecret, strongSecret);
});
