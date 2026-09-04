import test from "node:test";
import assert from "node:assert/strict";

const originalEnv = {
  NODE_ENV: process.env.NODE_ENV,
  JWT_SECRET: process.env.JWT_SECRET
};

function restoreEnv() {
  for (const [key, value] of Object.entries(originalEnv)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

async function importEnv(label) {
  return import(`../config/env.js?case=${label}-${Date.now()}-${Math.random()}`);
}

test("env keeps the development JWT secret fallback", async () => {
  delete process.env.NODE_ENV;
  delete process.env.JWT_SECRET;

  try {
    const { env } = await importEnv("development-fallback");

    assert.equal(env.nodeEnv, "development");
    assert.equal(env.jwtSecret, "development-secret");
  } finally {
    restoreEnv();
  }
});

test("env requires JWT_SECRET outside development", async () => {
  process.env.NODE_ENV = "production";
  delete process.env.JWT_SECRET;

  try {
    await assert.rejects(
      importEnv("production-missing-secret"),
      /JWT_SECRET is required outside development/
    );
  } finally {
    restoreEnv();
  }
});

test("env accepts JWT_SECRET outside development", async () => {
  process.env.NODE_ENV = "production";
  process.env.JWT_SECRET = "production-secret";

  try {
    const { env } = await importEnv("production-secret");

    assert.equal(env.nodeEnv, "production");
    assert.equal(env.jwtSecret, "production-secret");
  } finally {
    restoreEnv();
  }
});
