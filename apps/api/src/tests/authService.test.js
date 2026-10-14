import test from "node:test";
import assert from "node:assert/strict";
import { registerUser } from "../services/authService.js";
import { verifyAccessToken } from "../utils/jwt.js";

test("registerUser signs access token for the returned user id", async () => {
  const originalNow = Date.now;
  let now = 1700000000000;
  Date.now = () => now++;

  try {
    const user = await registerUser({
      email: "new-user@example.com",
      password: "correct-horse-battery-staple",
      role: "client"
    });
    const tokenPayload = verifyAccessToken(user.token);

    assert.equal(user.id, "usr_1700000000000");
    assert.equal(tokenPayload.sub, user.id);
    assert.equal(tokenPayload.role, user.role);
  } finally {
    Date.now = originalNow;
  }
});
