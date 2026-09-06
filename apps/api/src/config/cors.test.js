import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createEnvConfig } from "./env.js";

describe("CORS Origin Configuration (#11691)", () => {
  it("defaults corsOrigin to http://localhost:3000 when CORS_ORIGIN is unset", () => {
    const config = createEnvConfig({ NODE_ENV: "development" });
    assert.equal(config.corsOrigin, "http://localhost:3000");
  });

  it("respects custom CORS_ORIGIN environment variable", () => {
    const config = createEnvConfig({
      NODE_ENV: "production",
      JWT_SECRET: "supersecret12345",
      CORS_ORIGIN: "https://app.freelanceflow.io"
    });
    assert.equal(config.corsOrigin, "https://app.freelanceflow.io");
  });
});
