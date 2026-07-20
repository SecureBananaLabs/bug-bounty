import test from "node:test";
import assert from "node:assert/strict";
import { registerUser } from "../services/authService.js";
import { verifyAccessToken } from "../utils/jwt.js";

test("register token subject matches the returned user id", async () => {
  const originalNow = Date.now;
  const timestamps = [1700000000000, 1700000001000];
  Date.now = () => timestamps.shift() ?? 1700000001000;

  try {
    const result = await registerUser({
      email: "new-client@example.com",
      password: "correct horse battery staple",
      role: "client"
    });
    const decoded = verifyAccessToken(result.token);

    assert.equal(decoded.sub, result.id);
    assert.equal(decoded.role, result.role);
  } finally {
    Date.now = originalNow;
  }
});
