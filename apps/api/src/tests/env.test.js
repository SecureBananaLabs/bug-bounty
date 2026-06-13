import test from "node:test";
import assert from "node:assert/strict";
import { loadEnv } from "../config/env.js";

test("loadEnv keeps the development JWT fallback", () => {
  const env = loadEnv({ NODE_ENV: "development" });

  assert.equal(env.jwtSecret, "development-secret");
});

test("loadEnv requires JWT_SECRET outside development", () => {
  assert.throws(
    () => loadEnv({ NODE_ENV: "production" }),
    /JWT_SECRET is required outside development/
  );
});

test("loadEnv accepts JWT_SECRET outside development", () => {
  const env = loadEnv({
    NODE_ENV: "production",
    JWT_SECRET: "replace-me-with-a-real-secret"
  });

  assert.equal(env.jwtSecret, "replace-me-with-a-real-secret");
});