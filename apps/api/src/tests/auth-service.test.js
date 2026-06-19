import test from "node:test";
import assert from "node:assert/strict";
import { registerUser } from "../services/authService.js";
import { verifyAccessToken } from "../utils/jwt.js";

test("registerUser uses returned user id as access token subject", async () => {
  const originalNow = Date.now;
  const times = [1000, 1001];
  Date.now = () => times.shift() ?? 1001;

  try {
    const user = await registerUser({
      email: "client@example.com",
      password: "password123",
      role: "client"
    });
    const claims = verifyAccessToken(user.token);

    assert.equal(user.id, "usr_1000");
    assert.equal(claims.sub, user.id);
  } finally {
    Date.now = originalNow;
  }
});
