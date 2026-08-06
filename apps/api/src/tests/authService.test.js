import test from "node:test";
import assert from "node:assert/strict";
import { registerUser } from "../services/authService.js";
import { verifyAccessToken } from "../utils/jwt.js";

test("registerUser signs access token for the returned user id", async () => {
  const originalDateNow = Date.now;
  const timestamps = [1_700_000_000_000, 1_700_000_000_001];

  Date.now = () => timestamps.shift() ?? 1_700_000_000_002;

  try {
    const user = await registerUser({
      email: "client@example.com",
      role: "client"
    });
    const claims = verifyAccessToken(user.token);

    assert.equal(user.id, "usr_1700000000000");
    assert.equal(claims.sub, user.id);
    assert.equal(claims.role, "client");
  } finally {
    Date.now = originalDateNow;
  }
});
