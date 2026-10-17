import test from "node:test";
import assert from "node:assert/strict";
import { registerUser } from "../services/authService.js";
import { verifyAccessToken } from "../utils/jwt.js";

test("registerUser signs an access token for the returned user id", async () => {
  const originalNow = Date.now;
  const timestamps = [1000, 1001];
  Date.now = () => timestamps.shift() ?? 1001;

  try {
    const user = await registerUser({
      email: "client@example.com",
      password: "password123",
      role: "client"
    });
    const decoded = verifyAccessToken(user.token);

    assert.equal(user.id, "usr_1000");
    assert.equal(decoded.sub, user.id);
    assert.equal(decoded.role, "client");
  } finally {
    Date.now = originalNow;
  }
});
