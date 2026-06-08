import { describe, it, before, after } from "node:test";
import assert from "node:assert";

describe("env configuration", () => {
  let originalNodeEnv;
  let originalJwtSecret;

  before(() => {
    originalNodeEnv = process.env.NODE_ENV;
    originalJwtSecret = process.env.JWT_SECRET;
  });

  after(() => {
    process.env.NODE_ENV = originalNodeEnv;
    process.env.JWT_SECRET = originalJwtSecret;
  });

  it("should throw an error in production if JWT_SECRET is missing", async () => {
    process.env.NODE_ENV = "production";
    delete process.env.JWT_SECRET;

    await assert.rejects(
      async () => {
        await import("../config/env.js?t=" + Date.now());
      },
      (err) => {
        return err.message.includes("JWT_SECRET environment variable is required in production");
      }
    );
  });

  it("should load successfully in development even if JWT_SECRET is missing", async () => {
    process.env.NODE_ENV = "development";
    delete process.env.JWT_SECRET;

    const mod = await import("../config/env.js?t=" + Date.now());
    assert.strictEqual(mod.env.jwtSecret, "development-secret");
  });
});
