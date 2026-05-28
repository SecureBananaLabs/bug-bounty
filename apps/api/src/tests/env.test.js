import test from "node:test";
import assert from "node:assert/strict";
import { execSync } from "node:child_process";

test("JWT Secret Validation in production environment", () => {
  // 1. Should load successfully in development environment with default secret
  assert.doesNotThrow(() => {
    execSync("node -e \"import('./apps/api/src/config/env.js')\"", {
      env: { ...process.env, NODE_ENV: "development", JWT_SECRET: "development-secret" }
    });
  });

  // 2. Should load successfully in production environment with a custom secret
  assert.doesNotThrow(() => {
    execSync("node -e \"import('./apps/api/src/config/env.js')\"", {
      env: { ...process.env, NODE_ENV: "production", JWT_SECRET: "my-secure-production-only-secret-key-12345" }
    });
  });

  // 3. Should throw an error in production environment when JWT_SECRET is set to default
  assert.throws(() => {
    execSync("node -e \"import('./apps/api/src/config/env.js')\"", {
      env: { ...process.env, NODE_ENV: "production", JWT_SECRET: "development-secret" },
      stdio: "pipe"
    });
  });

  // 4. Should throw an error in production environment when JWT_SECRET is omitted
  assert.throws(() => {
    const cleanEnv = { ...process.env };
    delete cleanEnv.JWT_SECRET;
    execSync("node -e \"import('./apps/api/src/config/env.js')\"", {
      env: { ...cleanEnv, NODE_ENV: "production" },
      stdio: "pipe"
    });
  });
});
