import test from "node:test";
import assert from "node:assert/strict";
import { createEnv } from "../config/env.js";

test("createEnv keeps development JWT fallback", () => {
  const env = createEnv({ NODE_ENV: "development" });

  assert.equal(env.nodeEnv, "development");
  assert.equal(env.jwtSecret, "development-secret");
});

test("createEnv rejects missing production JWT_SECRET", () => {
  assert.throws(
    () => createEnv({ NODE_ENV: "production" }),
    /JWT_SECRET is required in production/
  );
});

test("createEnv accepts explicit production JWT_SECRET", () => {
  const env = createEnv({
    NODE_ENV: "production",
    JWT_SECRET: "prod-secret",
    PORT: "5000"
  });

  assert.equal(env.nodeEnv, "production");
  assert.equal(env.jwtSecret, "prod-secret");
  assert.equal(env.port, 5000);
});
