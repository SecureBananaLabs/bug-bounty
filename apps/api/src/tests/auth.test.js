import test from "node:test";
import assert from "node:assert/strict";
import { registerUser } from "../services/authService.js";
import { verifyAccessToken } from "../utils/jwt.js";

test("registerUser signs a token for the returned user id", async () => {
  const originalNow = Date.now;
  const timestamps = [1000, 2000, 3000];

  Date.now = () => timestamps.shift() ?? 3000;

  try {
    const user = await registerUser({
      email: "client@example.com",
      password: "password123",
      role: "client"
    });
    const claims = verifyAccessToken(user.token);

    assert.equal(user.id, "usr_1000");
    assert.equal(claims.sub, user.id);
    assert.equal(claims.role, "client");
  } finally {
    Date.now = originalNow;
  }
});
