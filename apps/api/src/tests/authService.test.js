import test from "node:test";
import assert from "node:assert/strict";
import { registerUser } from "../services/authService.js";
import { verifyAccessToken } from "../utils/jwt.js";

test("registerUser signs token with the returned user id as subject", async () => {
  const originalNow = Date.now;
  const timestamps = [1700000000000, 1700000001234];
  Date.now = () => timestamps.shift() ?? 1700000009999;

  try {
    const result = await registerUser({
      email: "client@example.com",
      password: "correct-horse-battery-staple",
      role: "client"
    });
    const decoded = verifyAccessToken(result.token);

    assert.equal(result.id, "usr_1700000000000");
    assert.equal(decoded.sub, result.id);
    assert.equal(decoded.role, "client");
  } finally {
    Date.now = originalNow;
  }
});
