import { describe, it, expect, beforeEach, afterEach } from "vitest";

describe("env config", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.DATABASE_URL;
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.JWT_SECRET;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("throws in production when DATABASE_URL is missing", async () => {
    process.env.NODE_ENV = "production";
    await expect(import("../config/env.js")).rejects.toThrow(
      /Missing required environment variable: DATABASE_URL/
    );
  });

  it("throws in production when STRIPE_SECRET_KEY is missing", async () => {
    process.env.NODE_ENV = "production";
    process.env.DATABASE_URL = "postgres://localhost/test";
    await expect(import("../config/env.js")).rejects.toThrow(
      /Missing required environment variable: STRIPE_SECRET_KEY/
    );
  });

  it("throws in production when DATABASE_URL is blank", async () => {
    process.env.NODE_ENV = "production";
    process.env.DATABASE_URL = "   ";
    await expect(import("../config/env.js")).rejects.toThrow(
      /Missing required environment variable: DATABASE_URL/
    );
  });

  it("allows missing config in development", async () => {
    process.env.NODE_ENV = "development";
    const { env } = await import("../config/env.js");
    expect(env.nodeEnv).toBe("development");
  });

  it("loads valid config in production", async () => {
    process.env.NODE_ENV = "production";
    process.env.DATABASE_URL = "postgres://localhost/prod";
    process.env.STRIPE_SECRET_KEY = "sk_test_123";
    process.env.JWT_SECRET = "secret-key";
    const { env } = await import("../config/env.js");
    expect(env.databaseUrl).toBe("postgres://localhost/prod");
    expect(env.stripeSecretKey).toBe("sk_test_123");
  });

  it("trims whitespace from values", async () => {
    process.env.NODE_ENV = "production";
    process.env.DATABASE_URL = "  postgres://localhost/test  ";
    process.env.STRIPE_SECRET_KEY = "sk_test_123";
    process.env.JWT_SECRET = "secret";
    const { env } = await import("../config/env.js");
    expect(env.databaseUrl).toBe("postgres://localhost/test");
  });
});
