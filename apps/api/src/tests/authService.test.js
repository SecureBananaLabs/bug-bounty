import test from "node:test";
import assert from "node:assert/strict";
import { registerUser } from "../services/authService.js";
import { verifyAccessToken } from "../utils/jwt.js";

test("registerUser signs a token subject matching the returned user id", async () => {
  const originalNow = Date.now;
  const timestamps = [1000, 1001, 1002];
  Date.now = () => timestamps.shift() ?? 1002;

  try {
    const result = await registerUser({
      email: "client@example.com",
      password: "password123",
      role: "client"
    });
    const decoded = verifyAccessToken(result.token);

    assert.equal(result.id, "usr_1000");
    assert.equal(decoded.sub, result.id);
    assert.equal(decoded.role, "client");
  } finally {
    Date.now = originalNow;
  }
});
