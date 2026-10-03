import test from "node:test";
import assert from "node:assert/strict";
import { loadEnv } from "../config/env.js";

test("uses the development JWT fallback for local development", () => {
  const config = loadEnv({});

  assert.equal(config.nodeEnv, "development");
  assert.equal(config.jwtSecret, "development-secret");
});

test("allows the development JWT fallback in test environments", () => {
  const config = loadEnv({ NODE_ENV: "test" });

  assert.equal(config.jwtSecret, "development-secret");
});

test("requires JWT_SECRET in production", () => {
  assert.throws(
    () => loadEnv({ NODE_ENV: "production" }),
    /JWT_SECRET is required when NODE_ENV is "production"/
  );
});

test("requires JWT_SECRET in other non-local environments", () => {
  assert.throws(
    () => loadEnv({ NODE_ENV: "staging" }),
    /JWT_SECRET is required when NODE_ENV is "staging"/
  );
});

test("rejects the known development JWT secret outside local environments", () => {
  assert.throws(
    () => loadEnv({ NODE_ENV: "production", JWT_SECRET: "development-secret" }),
    /JWT_SECRET must not use the development default/
  );
});

test("accepts an explicit JWT secret in production", () => {
  const config = loadEnv({ NODE_ENV: "production", JWT_SECRET: "a-strong-production-secret" });

  assert.equal(config.nodeEnv, "production");
  assert.equal(config.jwtSecret, "a-strong-production-secret");
});

test("treats a blank JWT secret as missing outside local environments", () => {
  assert.throws(
    () => loadEnv({ NODE_ENV: "production", JWT_SECRET: "   " }),
    /JWT_SECRET is required/
  );
});
