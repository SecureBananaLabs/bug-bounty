import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getJwtSecret } from "../config/env.js";

describe("Production JWT_SECRET Enforcement (getJwtSecret)", () => {
  it("falls back to development-secret when NODE_ENV is not production and JWT_SECRET is unset", () => {
    assert.equal(getJwtSecret({ NODE_ENV: "development" }), "development-secret");
    assert.equal(getJwtSecret({ NODE_ENV: "test", JWT_SECRET: "   " }), "development-secret");
  });

  it("returns custom JWT_SECRET in both development and production", () => {
    assert.equal(
      getJwtSecret({ NODE_ENV: "development", JWT_SECRET: "custom-dev-secret-123" }),
      "custom-dev-secret-123"
    );
    assert.equal(
      getJwtSecret({ NODE_ENV: "production", JWT_SECRET: "prod-high-entropy-secret-999" }),
      "prod-high-entropy-secret-999"
    );
  });

  it("throws descriptive Error in production when JWT_SECRET is missing, blank, or default", () => {
    assert.throws(
      () => getJwtSecret({ NODE_ENV: "production" }),
      /JWT_SECRET environment variable must be explicitly set/i
    );
    assert.throws(
      () => getJwtSecret({ NODE_ENV: "production", JWT_SECRET: "   " }),
      /JWT_SECRET environment variable must be explicitly set/i
    );
    assert.throws(
      () => getJwtSecret({ NODE_ENV: "production", JWT_SECRET: "development-secret" }),
      /JWT_SECRET environment variable must be explicitly set/i
    );
  });
});
