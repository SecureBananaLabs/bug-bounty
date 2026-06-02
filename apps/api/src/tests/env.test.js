import test from "node:test";
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const apiDir = join(__dirname, "..", "..");

test("development fallback: JWT_SECRET defaults to development-secret", async () => {
  const result = execSync(
    "node -e \"const {env} = await import('./src/config/env.js'); console.log(JSON.stringify(env))\"",
    { cwd: apiDir, encoding: "utf8", env: { ...process.env, NODE_ENV: "development" } }
  );
  const env = JSON.parse(result.trim());
  assert.equal(env.jwtSecret, "development-secret");
  assert.equal(env.nodeEnv, "development");
});

test("production: throws when JWT_SECRET is not set", async () => {
  try {
    execSync(
      "node -e \"import('./src/config/env.js')\"",
      { cwd: apiDir, encoding: "utf8", env: { ...process.env, NODE_ENV: "production" } }
    );
    assert.fail("Should have thrown");
  } catch (e) {
    assert.ok(e.stderr.includes("JWT_SECRET") || e.message.includes("JWT_SECRET"));
  }
});

test("production: uses provided JWT_SECRET", async () => {
  const result = execSync(
    "node -e \"const {env} = await import('./src/config/env.js'); console.log(JSON.stringify(env))\"",
    { cwd: apiDir, encoding: "utf8", env: { ...process.env, NODE_ENV: "production", JWT_SECRET: "my-secret-key" } }
  );
  const env = JSON.parse(result.trim());
  assert.equal(env.jwtSecret, "my-secret-key");
  assert.equal(env.nodeEnv, "production");
});

test("development: does not require JWT_SECRET", async () => {
  const result = execSync(
    "node -e \"const {env} = await import('./src/config/env.js'); console.log(JSON.stringify(env))\"",
    { cwd: apiDir, encoding: "utf8", env: { ...process.env, NODE_ENV: "development" } }
  );
  const env = JSON.parse(result.trim());
  assert.equal(env.jwtSecret, "development-secret");
});
