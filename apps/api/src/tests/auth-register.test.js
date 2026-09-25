import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { registerUser } from "../services/authService.js";

test("registerUser signs token with the same subject as returned id", async () => {
  const result = await registerUser({ email: "a@b.com", role: "client" });
  const decoded = jwt.decode(result.token);
  assert.equal(decoded.sub, result.id);
  assert.equal(decoded.role, "client");
});

test("registerUser id/sub stay consistent even when time advances", async () => {
  const originalNow = Date.now;
  let call = 0;
  // Each Date.now() call returns a different value, forcing the old
  // two-call bug to produce id !== sub.
  Date.now = () => ++call * 1000;
  try {
    const result = await registerUser({ email: "b@c.com", role: "client" });
    const decoded = jwt.decode(result.token);
    assert.equal(decoded.sub, result.id);
  } finally {
    Date.now = originalNow;
  }
});
