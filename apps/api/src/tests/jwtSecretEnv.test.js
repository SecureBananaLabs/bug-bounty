import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const configPath = fileURLToPath(new URL("../config/env.js", import.meta.url));

function loadEnv(env) {
  const script =
    "import { env } from " +
    JSON.stringify(configPath) +
    "; process.stdout.write(JSON.stringify(env));";

  const out = execFileSync(
    process.execPath,
    ["--input-type=module", "-e", script],
    { encoding: "utf8", env: { ...process.env, ...env } }
  );

  return JSON.parse(out);
}

test("development keeps the convenience fallback secret", () => {
  const env = loadEnv({ NODE_ENV: "development", JWT_SECRET: "" });

  assert.equal(env.jwtSecret, "development-secret");
});

test("production requires an explicit JWT_SECRET", () => {
  const env = loadEnv({ NODE_ENV: "production", JWT_SECRET: "s3cret-value" });

  assert.equal(env.jwtSecret, "s3cret-value");
});

test("production refuses the dev fallback when JWT_SECRET is missing", () => {
  const childEnv = { ...process.env, NODE_ENV: "production" };
  delete childEnv.JWT_SECRET;

  const script =
    "import { env } from " +
    JSON.stringify(configPath) +
    "; process.stdout.write(env.jwtSecret);";

  let failed = false;
  try {
    execFileSync(process.execPath, ["--input-type=module", "-e", script], {
      encoding: "utf8",
      env: childEnv,
      stdio: ["ignore", "pipe", "pipe"]
    });
  } catch (error) {
    failed = true;
    assert.match(String(error.stderr), /JWT_SECRET must be set/);
  }

  assert.equal(failed, true);
});
