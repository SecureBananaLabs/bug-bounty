import test from "node:test";
import assert from "node:assert/strict";
import { registerUser } from "../services/authService.js";
import { verifyAccessToken } from "../utils/jwt.js";

test("registerUser signs token subject with the returned user id", async () => {
  const originalDateNow = Date.now;
  let now = 1_000;
  Date.now = () => now++;

  try {
    const user = await registerUser({
      email: "new-user@example.com",
      password: "password123",
      role: "freelancer"
    });
    const tokenPayload = verifyAccessToken(user.token);

    assert.equal(user.id, "usr_1000");
    assert.equal(tokenPayload.sub, user.id);
    assert.equal(tokenPayload.role, "freelancer");
  } finally {
    Date.now = originalDateNow;
  }
});
