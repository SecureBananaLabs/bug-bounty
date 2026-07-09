import test from "node:test";
import assert from "node:assert/strict";
import { resolveJwtSecret } from "../config/env.js";

test("resolveJwtSecret keeps development fallback outside production", () => {
  assert.equal(resolveJwtSecret("development", undefined), "development-secret");
  assert.equal(resolveJwtSecret("test", ""), "development-secret");
});

test("resolveJwtSecret requires JWT_SECRET in production", () => {
  assert.throws(
    () => resolveJwtSecret("production", undefined),
    /JWT_SECRET is required when NODE_ENV=production/
  );
});

test("resolveJwtSecret accepts explicit production secret", () => {
  assert.equal(resolveJwtSecret("production", "prod-secret"), "prod-secret");
});
