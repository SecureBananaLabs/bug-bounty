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

test("production rejects missing JWT_SECRET", () => {
  const result = importEnvWith({
    NODE_ENV: "production",
    JWT_SECRET: "",
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /JWT_SECRET is required in production/);
});

test("development keeps the fallback JWT secret", () => {
  const result = importEnvWith({
    NODE_ENV: "development",
    JWT_SECRET: ""
  });

  assert.equal(result.status, 0);
});
