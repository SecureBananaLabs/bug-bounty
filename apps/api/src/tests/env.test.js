import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envModulePath = path.join(__dirname, "..", "config", "env.js");

function runWithJwtSecret(jwtSecret) {
  const childEnv = { ...process.env };
  if (jwtSecret === undefined) {
    delete childEnv.JWT_SECRET;
  } else {
    childEnv.JWT_SECRET = jwtSecret;
  }

  return spawnSync(process.execPath, [envModulePath], {
    env: childEnv,
    encoding: "utf8"
  });
}

test("refuses to start when JWT_SECRET is unset", () => {
  const result = runWithJwtSecret(undefined);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /JWT_SECRET/);
});

test("refuses to start when JWT_SECRET is the known-insecure default", () => {
  const result = runWithJwtSecret("development-secret");

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /JWT_SECRET/);
});

test("refuses to start when JWT_SECRET is the known-insecure default in a different case", () => {
  const result = runWithJwtSecret("Development-Secret");

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /JWT_SECRET/);
});

test("refuses to start when JWT_SECRET is whitespace only", () => {
  const result = runWithJwtSecret("   ");

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /JWT_SECRET/);
});

test("starts successfully when a real JWT_SECRET is provided", () => {
  const result = runWithJwtSecret("a-sufficiently-random-production-secret");

  assert.equal(result.status, 0);
  assert.equal(result.stderr, "");
});
