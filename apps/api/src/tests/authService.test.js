import test from "node:test";
import assert from "node:assert/strict";
import { registerUser } from "../services/authService.js";
import { verifyAccessToken } from "../utils/jwt.js";

test("registerUser signs a token for the returned user id", async () => {
  const originalNow = Date.now;
  const timestamps = [1000, 1001, 2000];
  Date.now = () => timestamps.shift() ?? 2000;

  try {
    const result = await registerUser({
      email: "new-client@example.com",
      password: "password123",
      role: "client"
    });
    const claims = verifyAccessToken(result.token);

    assert.equal(claims.sub, result.id);
    assert.equal(claims.role, "client");
  } finally {
    Date.now = originalNow;
  }
});
