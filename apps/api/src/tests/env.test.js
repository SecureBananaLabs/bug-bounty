import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envFilePath = path.join(__dirname, "../../../../.env");

test("native environment loader loads variables from .env file", async () => {
  // 1. Setup a temporary .env file at the workspace root (where process.cwd() starts)
  const originalEnvExists = fs.existsSync(envFilePath);
  let originalEnvContent = "";
  if (originalEnvExists) {
    originalEnvContent = fs.readFileSync(envFilePath, "utf8");
  }

  // Write custom test environment variables
  fs.writeFileSync(envFilePath, "PORT=12345\nJWT_SECRET=test-secret-env-file-load\nDATABASE_URL=postgres://test-db-url\n");

  try {
    // 2. Bypass ESM cache by using a cache-busting query parameter on import
    const { env } = await import(`../config/env.js?cb=${Date.now()}`);

    // 3. Assert values are loaded correctly from .env
    assert.equal(env.port, 12345);
    assert.equal(env.jwtSecret, "test-secret-env-file-load");
    assert.equal(env.databaseUrl, "postgres://test-db-url");
  } finally {
    // 4. Restore original .env or clean up
    if (originalEnvExists) {
      fs.writeFileSync(envFilePath, originalEnvContent);
    } else {
      fs.unlinkSync(envFilePath);
    }
  }
});

test("environment loader defaults to fallbacks when .env is absent", async () => {
  // Ensure .env does not exist for this test
  const originalEnvExists = fs.existsSync(envFilePath);
  let originalEnvContent = "";
  if (originalEnvExists) {
    originalEnvContent = fs.readFileSync(envFilePath, "utf8");
    fs.unlinkSync(envFilePath);
  }

  // Backup existing process.env variables to avoid interference
  const oldPort = process.env.PORT;
  const oldSecret = process.env.JWT_SECRET;
  delete process.env.PORT;
  delete process.env.JWT_SECRET;

  try {
    const { env } = await import(`../config/env.js?cb=${Date.now() + 1}`);

    // Assert it gracefully uses fallbacks without crashing
    assert.equal(env.port, 4000);
    assert.equal(env.jwtSecret, "development-secret");
  } finally {
    // Restore process.env
    if (oldPort !== undefined) process.env.PORT = oldPort;
    if (oldSecret !== undefined) process.env.JWT_SECRET = oldSecret;

    // Restore original .env
    if (originalEnvExists) {
      fs.writeFileSync(envFilePath, originalEnvContent);
    }
  }
});
