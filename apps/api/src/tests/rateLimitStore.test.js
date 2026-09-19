import test from "node:test";
import assert from "node:assert/strict";

async function importRateLimitModule(caseName) {
  return import(`../middleware/rateLimit.js?${caseName}-${Date.now()}`);
}

test("production refuses implicit process-local rate limit storage", async () => {
  const previousNodeEnv = process.env.NODE_ENV;
  const previousAllowMemoryStore = process.env.RATE_LIMIT_ALLOW_MEMORY_STORE;

  try {
    process.env.NODE_ENV = "production";
    delete process.env.RATE_LIMIT_ALLOW_MEMORY_STORE;

    await assert.rejects(
      () => importRateLimitModule("prod-memory-store-guard"),
      /RATE_LIMIT_ALLOW_MEMORY_STORE/
    );
  } finally {
    if (previousNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = previousNodeEnv;
    }

    if (previousAllowMemoryStore === undefined) {
      delete process.env.RATE_LIMIT_ALLOW_MEMORY_STORE;
    } else {
      process.env.RATE_LIMIT_ALLOW_MEMORY_STORE = previousAllowMemoryStore;
    }
  }
});

test("production can explicitly opt in to process-local rate limit storage", async () => {
  const previousNodeEnv = process.env.NODE_ENV;
  const previousAllowMemoryStore = process.env.RATE_LIMIT_ALLOW_MEMORY_STORE;

  try {
    process.env.NODE_ENV = "production";
    process.env.RATE_LIMIT_ALLOW_MEMORY_STORE = "true";

    const { apiLimiter } = await importRateLimitModule("prod-memory-store-opt-in");

    assert.equal(typeof apiLimiter, "function");
  } finally {
    if (previousNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = previousNodeEnv;
    }

    if (previousAllowMemoryStore === undefined) {
      delete process.env.RATE_LIMIT_ALLOW_MEMORY_STORE;
    } else {
      process.env.RATE_LIMIT_ALLOW_MEMORY_STORE = previousAllowMemoryStore;
    }
  }
});
