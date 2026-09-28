import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const envModuleUrl = new URL("../config/env.js", import.meta.url).href;
const keys = ["PORT", "JWT_SECRET", "STRIPE_SECRET_KEY", "DATABASE_URL"];

async function importFreshEnv() {
  return import(`${envModuleUrl}?t=${Date.now()}-${Math.random()}`);
}

function snapshotEnv() {
  return Object.fromEntries(keys.map((key) => [key, process.env[key]]));
}

function restoreEnv(snapshot) {
  for (const key of keys) {
    if (snapshot[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = snapshot[key];
    }
  }
}

test("loads API configuration from local .env when process env is unset", async () => {
  const cwd = process.cwd();
  const envSnapshot = snapshotEnv();
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "api-env-"));

  try {
    restoreEnv({});
    fs.writeFileSync(
      path.join(tmpDir, ".env"),
      [
        "PORT=4555",
        "JWT_SECRET=file-secret",
        "STRIPE_SECRET_KEY=sk_test_file",
        "DATABASE_URL=postgres://file-db"
      ].join("\n")
    );

    process.chdir(tmpDir);
    const { env } = await importFreshEnv();

    assert.equal(env.port, 4555);
    assert.equal(env.jwtSecret, "file-secret");
    assert.equal(env.stripeSecretKey, "sk_test_file");
    assert.equal(env.databaseUrl, "postgres://file-db");
  } finally {
    process.chdir(cwd);
    restoreEnv(envSnapshot);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("keeps process environment values ahead of local .env values", async () => {
  const cwd = process.cwd();
  const envSnapshot = snapshotEnv();
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "api-env-"));

  try {
    restoreEnv({});
    process.env.JWT_SECRET = "process-secret";
    fs.writeFileSync(path.join(tmpDir, ".env"), "JWT_SECRET=file-secret\n");

    process.chdir(tmpDir);
    const { env } = await importFreshEnv();

    assert.equal(env.jwtSecret, "process-secret");
  } finally {
    process.chdir(cwd);
    restoreEnv(envSnapshot);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
