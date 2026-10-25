import test from "node:test";
import assert from "node:assert/strict";

test("env.js configuration tests", async (t) => {
  const originalEnv = { ...process.env };

  t.afterEach(() => {
    // Reset process.env and NODE_ENV
    process.env = { ...originalEnv };
  });

  await t.test("falls back to 'development-secret' when NODE_ENV is not production and JWT_SECRET is unset", async () => {
    delete process.env.NODE_ENV;
    delete process.env.JWT_SECRET;
    
    const { env } = await import(`../config/env.js?t=${Date.now()}`);
    assert.equal(env.jwtSecret, "development-secret");
  });

  await t.test("uses custom JWT_SECRET when provided in development", async () => {
    delete process.env.NODE_ENV;
    process.env.JWT_SECRET = "my-custom-dev-secret";
    
    const { env } = await import(`../config/env.js?t=${Date.now() + 1}`);
    assert.equal(env.jwtSecret, "my-custom-dev-secret");
  });

  await t.test("throws an error when NODE_ENV is production and JWT_SECRET is missing", async () => {
    process.env.NODE_ENV = "production";
    delete process.env.JWT_SECRET;
    
    await assert.rejects(
      async () => {
        await import(`../config/env.js?t=${Date.now() + 2}`);
      },
      (err) => {
        assert(err instanceof Error);
        assert.match(err.message, /JWT_SECRET is required in production/);
        return true;
      }
    );
  });

  await t.test("accepts JWT_SECRET when provided in production", async () => {
    process.env.NODE_ENV = "production";
    process.env.JWT_SECRET = "strong-prod-secret";
    
    const { env } = await import(`../config/env.js?t=${Date.now() + 3}`);
    assert.equal(env.jwtSecret, "strong-prod-secret");
  });
});
