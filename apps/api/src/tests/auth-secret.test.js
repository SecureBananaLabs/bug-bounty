import test from "node:test";
import assert from "node:assert/strict";
import { assertJwtSecret } from "../utils/jwt.js";

test("JWT signing fails closed without a sufficiently strong configured secret", () => {
  const previousSecret = process.env.JWT_SECRET;
  try {
    delete process.env.JWT_SECRET;
    assert.throws(() => assertJwtSecret(), /JWT_SECRET must contain at least 32 bytes/);

    process.env.JWT_SECRET = "short-secret";
    assert.throws(() => assertJwtSecret(), /JWT_SECRET must contain at least 32 bytes/);

    process.env.JWT_SECRET = "test-only-secret-with-at-least-32-bytes";
    assert.doesNotThrow(() => assertJwtSecret());
  } finally {
    if (previousSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = previousSecret;
    }
  }
});
