import test from "node:test";
import assert from "node:assert/strict";

test("env.js configuration rules", async (t) => {
  const originalEnv = { ...process.env };

  t.afterEach(() => {
    process.env = { ...originalEnv };
  });

  await t.test("allows development environment to use default secret", async () => {
    process.env.NODE_ENV = "development";
    delete process.env.JWT_SECRET;
    const { env } = await import(`../config/env.js?cb=${Date.now()}-1`);
    assert.equal(env.jwtSecret, "development-secret");
  });

  await t.test("throws error in production environment when JWT_SECRET is missing", async () => {
    process.env.NODE_ENV = "production";
    delete process.env.JWT_SECRET;
    await assert.rejects(
      async () => {
        await import(`../config/env.js?cb=${Date.now()}-2`);
      },
      (err) => {
        return err instanceof Error && err.message.includes("JWT_SECRET");
      }
    );
  });

  await t.test("allows production environment with custom JWT_SECRET", async () => {
    process.env.NODE_ENV = "production";
    process.env.JWT_SECRET = "super-secret-prod-key";
    const { env } = await import(`../config/env.js?cb=${Date.now()}-3`);
    assert.equal(env.jwtSecret, "super-secret-prod-key");
  });
});
