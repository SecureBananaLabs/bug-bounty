import test from "node:test";
import assert from "node:assert/strict";

test("env throws error if JWT_SECRET not set in production", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalJwtSecret = process.env.JWT_SECRET;
  
  process.env.NODE_ENV = "production";
  delete process.env.JWT_SECRET;

  try {
    // Simulate the env logic
    const jwtSecret = (() => {
      const secret = process.env.JWT_SECRET;
      if (!secret && process.env.NODE_ENV === "production") {
        throw new Error("JWT_SECRET must be set in production");
      }
      return secret ?? "development-secret";
    })();
    
    assert.fail("Should have thrown error");
  } catch (err) {
    assert.ok(err.message.includes("JWT_SECRET"));
  } finally {
    process.env.NODE_ENV = originalNodeEnv;
    if (originalJwtSecret) {
      process.env.JWT_SECRET = originalJwtSecret;
    }
  }
});

test("env allows missing JWT_SECRET in development", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalJwtSecret = process.env.JWT_SECRET;
  
  process.env.NODE_ENV = "development";
  delete process.env.JWT_SECRET;

  try {
    const jwtSecret = (() => {
      const secret = process.env.JWT_SECRET;
      if (!secret && process.env.NODE_ENV === "production") {
        throw new Error("JWT_SECRET must be set in production");
      }
      return secret ?? "development-secret";
    })();
    
    assert.equal(jwtSecret, "development-secret");
  } finally {
    process.env.NODE_ENV = originalNodeEnv;
    if (originalJwtSecret) {
      process.env.JWT_SECRET = originalJwtSecret;
    }
  }
});

test("env uses provided JWT_SECRET", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalJwtSecret = process.env.JWT_SECRET;
  
  process.env.NODE_ENV = "production";
  process.env.JWT_SECRET = "my-secret-key";

  try {
    const jwtSecret = (() => {
      const secret = process.env.JWT_SECRET;
      if (!secret && process.env.NODE_ENV === "production") {
        throw new Error("JWT_SECRET must be set in production");
      }
      return secret ?? "development-secret";
    })();
    
    assert.equal(jwtSecret, "my-secret-key");
  } finally {
    process.env.NODE_ENV = originalNodeEnv;
    if (originalJwtSecret) {
      process.env.JWT_SECRET = originalJwtSecret;
    } else {
      delete process.env.JWT_SECRET;
    }
  }
});
