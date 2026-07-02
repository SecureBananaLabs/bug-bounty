import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

const envModulePath = new URL("../config/env.js", import.meta.url).pathname;
const nodeBinary = process.execPath;

function importEnvWith(overrides) {
  return spawnSync(
    nodeBinary,
    ["--input-type=module", "-e", `await import(${JSON.stringify(envModulePath)})`],
    {
      env: {
        ...process.env,
        ...overrides
      },
      encoding: "utf8"
    }
  );
}

test("production rejects blank DATABASE_URL", () => {
  const result = importEnvWith({
    NODE_ENV: "production",
    DATABASE_URL: "   ",
    STRIPE_SECRET_KEY: "sk_test_123"
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /DATABASE_URL is required in production/);
});

test("production rejects blank STRIPE_SECRET_KEY", () => {
  const result = importEnvWith({
    NODE_ENV: "production",
    DATABASE_URL: "postgres://db",
    STRIPE_SECRET_KEY: "   "
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /STRIPE_SECRET_KEY is required in production/);
});

test("development allows blank infrastructure secrets", () => {
  const result = importEnvWith({
    NODE_ENV: "development",
    DATABASE_URL: "",
    STRIPE_SECRET_KEY: ""
  });

  assert.equal(result.status, 0);
});
