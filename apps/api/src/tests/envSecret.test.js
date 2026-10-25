import test from "node:test";
import assert from "node:assert/strict";
import { buildEnv, resolveJwtSecret } from "../config/env.js";

test("local environments keep the development fallback secret", () => {
  assert.equal(resolveJwtSecret("development", undefined), "development-secret");
  assert.equal(resolveJwtSecret("test", "  "), "development-secret");
  assert.equal(resolveJwtSecret("local", "typed-secret"), "typed-secret");
});

test("non-local environments require an explicit JWT_SECRET", () => {
  assert.throws(() => resolveJwtSecret("production", undefined), /JWT_SECRET/);
  assert.throws(() => resolveJwtSecret("staging", ""), /JWT_SECRET/);
  assert.equal(resolveJwtSecret("production", "real-secret"), "real-secret");
});

test("buildEnv trims the secret and keeps the port default", () => {
  const env = buildEnv({ NODE_ENV: "production", JWT_SECRET: "  real-secret  " });

  assert.equal(env.jwtSecret, "real-secret");
  assert.equal(env.port, 4000);
  assert.equal(env.nodeEnv, "production");
});
