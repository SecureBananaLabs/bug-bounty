import test from "node:test";
import assert from "node:assert/strict";

test("env: development uses fallback jwtSecret", async () => {
  const original = process.env.NODE_ENV;
  const originalJwt = process.env.JWT_SECRET;

  process.env.NODE_ENV = "development";
  delete process.env.JWT_SECRET;

  const mod = await import("../config/env.js?" + Date.now());
  assert.equal(mod.env.jwtSecret, "development-secret");

  process.env.NODE_ENV = original;
  if (originalJwt) process.env.JWT_SECRET = originalJwt;
});

test("env: production throws when JWT_SECRET is missing", async () => {
  const original = process.env.NODE_ENV;
  const originalJwt = process.env.JWT_SECRET;

  process.env.NODE_ENV = "production";
  delete process.env.JWT_SECRET;

  await assert.rejects(
    () => import("../config/env.js?" + Date.now()),
    /JWT_SECRET must be set in production/
  );

  process.env.NODE_ENV = original;
  if (originalJwt) process.env.JWT_SECRET = originalJwt;
});

test("env: production accepts explicit JWT_SECRET", async () => {
  const original = process.env.NODE_ENV;
  const originalJwt = process.env.JWT_SECRET;

  process.env.NODE_ENV = "production";
  process.env.JWT_SECRET = "my-real-secret";

  const mod = await import("../config/env.js?" + Date.now());
  assert.equal(mod.env.jwtSecret, "my-real-secret");

  process.env.NODE_ENV = original;
  if (originalJwt) process.env.JWT_SECRET = originalJwt;
  else delete process.env.JWT_SECRET;
});