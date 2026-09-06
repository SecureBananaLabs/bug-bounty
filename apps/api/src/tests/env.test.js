import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

const envModuleUrl = new URL("../config/env.js", import.meta.url).href;

function importEnvWith(overrides) {
  return spawnSync(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      `import { env } from ${JSON.stringify(envModuleUrl)}; console.log(JSON.stringify(env));`
    ],
    {
      env: { ...process.env, ...overrides },
      encoding: "utf8"
    }
  );
}

test("env keeps development fallback JWT secret", () => {
  const result = importEnvWith({ NODE_ENV: "development", JWT_SECRET: "" });

  assert.equal(result.status, 0);
  assert.deepEqual(JSON.parse(result.stdout.trim()), {
    nodeEnv: "development",
    port: 4000,
    jwtSecret: "development-secret",
    stripeSecretKey: "",
    databaseUrl: ""
  });
});

test("env rejects missing JWT secret in production", () => {
  const result = importEnvWith({ NODE_ENV: "production", JWT_SECRET: "" });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /JWT_SECRET must be set in production/);
});
