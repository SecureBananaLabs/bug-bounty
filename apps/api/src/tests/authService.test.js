import test from "node:test";
import assert from "node:assert/strict";
import { registerUser } from "../services/authService.js";
import { verifyAccessToken } from "../utils/jwt.js";

test("registerUser signs access token for the returned user id", async () => {
  const originalDateNow = Date.now;
  let now = 1_700_000_000_000;

  Date.now = () => now++;

  try {
    const result = await registerUser({
      email: "new-client@example.com",
      password: "password123",
      role: "client"
    });

    const decoded = verifyAccessToken(result.token);

    assert.equal(decoded.sub, result.id);
    assert.equal(decoded.role, result.role);
  } finally {
    Date.now = originalDateNow;
  }
});
