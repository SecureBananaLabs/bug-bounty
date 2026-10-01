import test from "node:test";
import assert from "node:assert/strict";
import { registerUser } from "../services/authService.js";
import { verifyAccessToken } from "../utils/jwt.js";

test("registerUser signs the access token for the created user id", async () => {
  const originalNow = Date.now;
  const timestamps = [1710000000000, 1710000009999];
  Date.now = () => timestamps.shift() ?? 1710000009999;

  try {
    const user = await registerUser({
      email: "client@example.com",
      password: "correct-horse",
      role: "client"
    });
    const decoded = verifyAccessToken(user.token);

    assert.equal(user.id, "usr_1710000000000");
    assert.equal(decoded.sub, user.id);
    assert.equal(decoded.role, "client");
  } finally {
    Date.now = originalNow;
  }
});
