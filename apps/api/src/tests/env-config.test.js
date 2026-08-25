import test from "node:test";
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import path from "node:path";

const envModuleUrl = pathToFileURL(
  path.resolve("apps/api/src/config/env.js")
).href;

async function importEnvWith({ nodeEnv, jwtSecret }) {
  const previousNodeEnv = process.env.NODE_ENV;
  const previousJwtSecret = process.env.JWT_SECRET;

  if (nodeEnv === undefined) {
    delete process.env.NODE_ENV;
  } else {
    process.env.NODE_ENV = nodeEnv;
  }

  if (jwtSecret === undefined) {
    delete process.env.JWT_SECRET;
  } else {
    process.env.JWT_SECRET = jwtSecret;
  }

  try {
    return await import(`${envModuleUrl}?case=${Date.now()}-${Math.random()}`);
  } finally {
    if (previousNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = previousNodeEnv;
    }

    if (previousJwtSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = previousJwtSecret;
    }
  }
}

test("env keeps the development JWT fallback", async () => {
  const { env } = await importEnvWith({
    nodeEnv: "development",
    jwtSecret: undefined,
  });

  assert.equal(env.jwtSecret, "development-secret");
});

test("env requires JWT_SECRET outside development", async () => {
  await assert.rejects(
    () => importEnvWith({ nodeEnv: "production", jwtSecret: undefined }),
    /JWT_SECRET is required outside development/
  );
});

test("env accepts JWT_SECRET outside development", async () => {
  const { env } = await importEnvWith({
    nodeEnv: "production",
    jwtSecret: "strong-secret",
  });

  assert.equal(env.jwtSecret, "strong-secret");
});
