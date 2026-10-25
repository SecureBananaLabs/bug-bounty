import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const envModuleUrl = pathToFileURL(
  path.resolve("apps/api/src/config/env.js")
).href;

async function importEnvModule() {
  return import(`${envModuleUrl}?ts=${Date.now()}-${Math.random()}`);
}

test("env requires JWT_SECRET", async () => {
  const previousJwtSecret = process.env.JWT_SECRET;

  delete process.env.JWT_SECRET;

  try {
    await assert.rejects(
      () => importEnvModule(),
      /JWT_SECRET environment variable is required/
    );
  } finally {
    if (previousJwtSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = previousJwtSecret;
    }
  }
});

test("env uses the configured JWT_SECRET", async () => {
  const previousJwtSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = "configured-secret";

  try {
    const { env } = await importEnvModule();
    assert.equal(env.jwtSecret, "configured-secret");
  } finally {
    if (previousJwtSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = previousJwtSecret;
    }
  }
});
