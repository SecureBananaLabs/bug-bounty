import test from "node:test";
import assert from "node:assert/strict";
import { registerUser } from "../services/authService.js";
import { verifyAccessToken } from "../utils/jwt.js";

test("register returns a token subject matching the returned user id", async () => {
  const originalDateNow = Date.now;
  let timestamp = 1700000000000;
  Date.now = () => timestamp++;

  try {
    const user = await registerUser({
      email: "client@example.com",
      password: "password123",
      role: "client"
    });

    const token = verifyAccessToken(user.token);
    assert.equal(token.sub, user.id);
  } finally {
    Date.now = originalDateNow;
  }
});
