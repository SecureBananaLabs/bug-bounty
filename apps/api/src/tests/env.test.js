import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

function importEnvWith(overrides) {
  const script = "await import('./src/config/env.js');";
  return spawnSync(process.execPath, ["--input-type=module", "--eval", script], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      ...overrides
    },
    encoding: "utf8"
  });
}

test("production env requires JWT_SECRET", () => {
  const result = importEnvWith({
    NODE_ENV: "production",
    JWT_SECRET: ""
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /JWT_SECRET is required in production/);
});

test("production env accepts an explicit JWT_SECRET", () => {
  const result = importEnvWith({
    NODE_ENV: "production",
    JWT_SECRET: "prod-secret"
  });

  assert.equal(result.status, 0);
});

test("development env keeps the fallback JWT secret", () => {
  const result = importEnvWith({
    NODE_ENV: "development",
    JWT_SECRET: ""
  });

  assert.equal(result.status, 0);
});
