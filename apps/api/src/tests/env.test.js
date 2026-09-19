import test from "node:test";
import assert from "node:assert/strict";

const envModuleUrl = new URL("../config/env.js", import.meta.url);
let importCounter = 0;

async function withEnv(overrides, callback) {
  const previous = {};
  for (const key of Object.keys(overrides)) {
    previous[key] = process.env[key];
    if (overrides[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = overrides[key];
    }
  }

  try {
    return await callback();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

async function loadFreshEnv() {
  importCounter += 1;
  return import(`${envModuleUrl.href}?case=${importCounter}`);
}

test("env keeps the development JWT fallback for local use", async () => {
  const module = await withEnv({ NODE_ENV: undefined, JWT_SECRET: undefined }, loadFreshEnv);

  assert.equal(module.env.nodeEnv, "development");
  assert.equal(module.env.jwtSecret, "development-secret");
});

test("env requires JWT_SECRET outside development", async () => {
  await assert.rejects(
    () => withEnv({ NODE_ENV: "production", JWT_SECRET: undefined }, loadFreshEnv),
    /JWT_SECRET is required/
  );
});

test("env accepts an explicit JWT_SECRET outside development", async () => {
  const module = await withEnv({ NODE_ENV: "production", JWT_SECRET: "prod-secret" }, loadFreshEnv);

  assert.equal(module.env.nodeEnv, "production");
  assert.equal(module.env.jwtSecret, "prod-secret");
});
