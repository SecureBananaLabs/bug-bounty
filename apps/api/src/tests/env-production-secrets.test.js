import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

const envModulePath = new URL("../config/env.js", import.meta.url).pathname;

function loadEnv(overrides, expression = "env.databaseUrl") {
  return spawnSync(
    process.execPath,
    ["--input-type=module", "-e", `import { env } from ${JSON.stringify(envModulePath)}; console.log(${expression});`],
    {
      cwd: process.cwd(),
      encoding: "utf8",
      env: {
        ...process.env,
        ...overrides
      }
    }
  );
}

test("development imports stay compatible with blank database and stripe secrets", () => {
  const result = loadEnv({
    NODE_ENV: "development",
    DATABASE_URL: "",
    STRIPE_SECRET_KEY: ""
  });

  assert.equal(result.status, 0);
  assert.equal(result.stdout.trim(), "");
});

test("production rejects blank DATABASE_URL", () => {
  const result = loadEnv({
    NODE_ENV: "production",
    DATABASE_URL: "   ",
    STRIPE_SECRET_KEY: "sk_test_123"
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /DATABASE_URL is required in production/);
});

test("production rejects blank STRIPE_SECRET_KEY", () => {
  const result = loadEnv({
    NODE_ENV: "production",
    DATABASE_URL: "postgres://db",
    STRIPE_SECRET_KEY: "   "
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /STRIPE_SECRET_KEY is required in production/);
});

test("production accepts non-blank database and stripe secrets", () => {
  const result = loadEnv(
    {
      NODE_ENV: "production",
      DATABASE_URL: "postgres://db",
      STRIPE_SECRET_KEY: "sk_test_123"
    },
    "`${env.databaseUrl}|${env.stripeSecretKey}`"
  );

  assert.equal(result.status, 0);
  assert.equal(result.stdout.trim(), "postgres://db|sk_test_123");
});
