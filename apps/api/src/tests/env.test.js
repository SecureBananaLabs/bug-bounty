import test from "node:test";
import assert from "node:assert/strict";

async function importFreshEnv() {
  return import(`../config/env.js?case=${Date.now()}-${Math.random()}`);
}

function snapshotEnv() {
  return {
    NODE_ENV: process.env.NODE_ENV,
    JWT_SECRET: process.env.JWT_SECRET
  };
}

function restoreEnv(snapshot) {
  for (const key of Object.keys(snapshot)) {
    if (snapshot[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = snapshot[key];
    }
  }
}

test("env uses a development JWT fallback only in development", async () => {
  const original = snapshotEnv();
  try {
    process.env.NODE_ENV = "development";
    delete process.env.JWT_SECRET;

    const { env } = await importFreshEnv();

    assert.equal(env.nodeEnv, "development");
    assert.equal(env.jwtSecret, "development-secret");
  } finally {
    restoreEnv(original);
  }
});

test("env requires JWT_SECRET outside development", async () => {
  const original = snapshotEnv();
  try {
    process.env.NODE_ENV = "production";
    delete process.env.JWT_SECRET;

    await assert.rejects(importFreshEnv(), /JWT_SECRET is required outside development/);
  } finally {
    restoreEnv(original);
  }
});

test("env accepts explicit JWT_SECRET outside development", async () => {
  const original = snapshotEnv();
  try {
    process.env.NODE_ENV = "production";
    process.env.JWT_SECRET = "production-secret";

    const { env } = await importFreshEnv();

    assert.equal(env.nodeEnv, "production");
    assert.equal(env.jwtSecret, "production-secret");
  } finally {
    restoreEnv(original);
  }
});
