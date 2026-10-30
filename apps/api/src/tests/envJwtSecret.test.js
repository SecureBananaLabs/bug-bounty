import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

const envModulePath = new URL("../config/env.js", import.meta.url).pathname.replaceAll("\\", "/");

function runEnvImport(env) {
  return spawnSync(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      `import("${envModulePath}").then(({ env }) => console.log(env.jwtSecret)).catch((error) => { console.error(error.message); process.exit(1); });`
    ],
    {
      env: {
        ...process.env,
        ...env
      },
      encoding: "utf8"
    }
  );
}

test("env uses the development fallback secret locally", () => {
  const result = runEnvImport({
    NODE_ENV: "development",
    JWT_SECRET: ""
  });

  assert.equal(result.status, 0);
  assert.match(result.stdout, /development-secret/);
});

test("env rejects missing JWT_SECRET outside development", () => {
  const result = runEnvImport({
    NODE_ENV: "production",
    JWT_SECRET: ""
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /JWT_SECRET must be set outside development/);
});

test("env accepts an explicit JWT secret outside development", () => {
  const result = runEnvImport({
    NODE_ENV: "production",
    JWT_SECRET: "super-secret"
  });

  assert.equal(result.status, 0);
  assert.match(result.stdout, /super-secret/);
});
