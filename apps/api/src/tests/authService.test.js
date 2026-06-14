import test from "node:test";
import assert from "node:assert/strict";
import { registerUser } from "../services/authService.js";
import { verifyAccessToken } from "../utils/jwt.js";

test("registration token subject matches the returned user id", async () => {
  const originalNow = Date.now;
  let timestamp = 1700000000000;

  Date.now = () => timestamp++;

  try {
    const result = await registerUser({
      email: "client@example.com",
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
