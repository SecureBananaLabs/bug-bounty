import test from "node:test";
import assert from "node:assert/strict";
import { resolveEnv } from "../config/env.js";

test("resolveEnv requires DATABASE_URL in production", () => {
  assert.throws(
    () => resolveEnv({ NODE_ENV: "production", DATABASE_URL: "   " }),
    /DATABASE_URL is required in production/
  );
});

test("resolveEnv keeps development DATABASE_URL optional", () => {
  const env = resolveEnv({ NODE_ENV: "development" });

  assert.equal(env.nodeEnv, "development");
  assert.equal(env.databaseUrl, "");
  assert.equal(env.port, 4000);
});

test("resolveEnv accepts production DATABASE_URL", () => {
  const env = resolveEnv({
    NODE_ENV: "production",
    DATABASE_URL: "postgresql://user:pass@example.com:5432/app"
  });

  assert.equal(env.databaseUrl, "postgresql://user:pass@example.com:5432/app");
});
