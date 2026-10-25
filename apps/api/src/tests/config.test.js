import test from "node:test";
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const nodeBin = process.argv[0];

test("config: JWT_SECRET validation in production", () => {
  // Scenario 1: NODE_ENV is production and JWT_SECRET is provided -> should succeed
  assert.doesNotThrow(() => {
    execSync(`"${nodeBin}" -e "import('./src/config/env.js').then(({ env }) => { if (env.jwtSecret !== 'prod-sec') throw new Error('Expected prod-sec'); })"`, {
      cwd: join(__dirname, "../.."),
      env: { ...process.env, NODE_ENV: "production", JWT_SECRET: "prod-sec" },
      stdio: "pipe"
    });
  });

  // Scenario 2: NODE_ENV is production and JWT_SECRET is missing -> should throw
  assert.throws(() => {
    const customEnv = { ...process.env, NODE_ENV: "production" };
    delete customEnv.JWT_SECRET;
    execSync(`"${nodeBin}" -e "import('./src/config/env.js')"`, {
      cwd: join(__dirname, "../.."),
      env: customEnv,
      stdio: "pipe"
    });
  });

  // Scenario 3: NODE_ENV is development and JWT_SECRET is missing -> should succeed and fall back to development-secret
  assert.doesNotThrow(() => {
    const customEnv = { ...process.env, NODE_ENV: "development" };
    delete customEnv.JWT_SECRET;
    execSync(`"${nodeBin}" -e "import('./src/config/env.js').then(({ env }) => { if (env.jwtSecret !== 'development-secret') throw new Error('Expected development-secret'); })"`, {
      cwd: join(__dirname, "../.."),
      env: customEnv,
      stdio: "pipe"
    });
  });
});
