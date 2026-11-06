import test from "node:test";
import assert from "node:assert/strict";
import { registerUser } from "../services/authService.js";
import { verifyAccessToken } from "../utils/jwt.js";

test("registerUser signs a token for the returned user id", async () => {
  const originalNow = Date.now;
  Date.now = (() => {
    const values = [123456, 789012];
    return () => values.shift() ?? 789012;
  })();

  try {
    const result = await registerUser({
      email: "new.client@example.com",
      password: "correct-horse-battery-staple",
      role: "client"
    });
    const claims = verifyAccessToken(result.token);

    assert.equal(result.id, "usr_123456");
    assert.equal(claims.sub, result.id);
    assert.equal(claims.role, "client");
  } finally {
    Date.now = originalNow;
  }
});
