import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getJwtSecret, createEnvConfig } from "./env.js";

describe("Environment Config & JWT_SECRET Security (#11726)", () => {
  it("uses development-secret fallback when outside production and JWT_SECRET is unset", () => {
    const config = createEnvConfig({ NODE_ENV: "development" });
    assert.equal(config.jwtSecret, "development-secret");
  });

  it("uses provided JWT_SECRET in development if set", () => {
    const config = createEnvConfig({ NODE_ENV: "development", JWT_SECRET: "my-custom-dev-secret" });
    assert.equal(config.jwtSecret, "my-custom-dev-secret");
  });

  it("uses provided JWT_SECRET in production", () => {
    const config = createEnvConfig({ NODE_ENV: "production", JWT_SECRET: "super-secure-prod-key-12345" });
    assert.equal(config.jwtSecret, "super-secure-prod-key-12345");
  });

  it("throws fast error in production when JWT_SECRET is missing", () => {
    assert.throws(
      () => {
        createEnvConfig({ NODE_ENV: "production" });
      },
      {
        name: "Error",
        message: /JWT_SECRET is required in production environment/
      }
    );
  });
});
