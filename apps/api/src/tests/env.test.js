import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";

const configUrl = new URL("../config/env.js", import.meta.url).href;

function loadConfig({ nodeEnv, jwtSecret } = {}) {
  const childEnv = { ...process.env };

  delete childEnv.NODE_ENV;
  delete childEnv.JWT_SECRET;

  if (nodeEnv !== undefined) childEnv.NODE_ENV = nodeEnv;
  if (jwtSecret !== undefined) childEnv.JWT_SECRET = jwtSecret;

  return spawnSync(
    process.execPath,
    [
      "--input-type=module",
      "--eval",
      `import { env } from ${JSON.stringify(configUrl)}; console.log(JSON.stringify({ nodeEnv: env.nodeEnv, jwtSecret: env.jwtSecret }));`,
    ],
    {
      env: childEnv,
      encoding: "utf8",
    }
  );
}

test("non-local environments reject a missing JWT secret", () => {
  for (const nodeEnv of ["production", "staging"]) {
    const result = loadConfig({ nodeEnv });

    assert.notEqual(result.status, 0, `${nodeEnv} unexpectedly started`);
    assert.match(
      result.stderr,
      /JWT_SECRET must be set to a non-default value outside development and test environments/
    );
  }
});

test("production rejects blank and known development JWT secrets", () => {
  for (const jwtSecret of ["", "   ", "development-secret"]) {
    const result = loadConfig({ nodeEnv: "production", jwtSecret });

    assert.notEqual(result.status, 0, `production accepted ${JSON.stringify(jwtSecret)}`);
    assert.match(
      result.stderr,
      /JWT_SECRET must be set to a non-default value outside development and test environments/
    );
  }
});

test("development and test keep the local fallback", () => {
  for (const nodeEnv of ["development", "test"]) {
    const result = loadConfig({ nodeEnv });

    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(JSON.parse(result.stdout), {
      nodeEnv,
      jwtSecret: "development-secret",
    });
  }
});

test("production accepts an explicitly configured non-default JWT secret", () => {
  const result = loadConfig({
    nodeEnv: "production",
    jwtSecret: "replace-with-a-real-random-secret",
  });

  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), {
    nodeEnv: "production",
    jwtSecret: "replace-with-a-real-random-secret",
  });
});
