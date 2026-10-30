import test from "node:test";
import assert from "node:assert/strict";
import { resolveJwtSecret } from "../config/env.js";

test("resolveJwtSecret preserves configured secrets", () => {
  assert.equal(resolveJwtSecret("production", "  configured-secret  "), "configured-secret");
});

test("resolveJwtSecret keeps development fallback", () => {
  assert.equal(resolveJwtSecret("development", undefined), "development-secret");
  assert.equal(resolveJwtSecret("test", ""), "development-secret");
});

test("resolveJwtSecret rejects missing production secrets", () => {
  assert.throws(
    () => resolveJwtSecret("production", undefined),
    /JWT_SECRET is required in production/
  );
  assert.throws(() => resolveJwtSecret("production", "   "), /JWT_SECRET is required in production/);
});
