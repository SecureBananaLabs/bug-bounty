import test from "node:test";
import assert from "node:assert/strict";
import { registerUser } from "../services/authService.js";
import { verifyAccessToken } from "../utils/jwt.js";

test("registerUser signs access token for the returned user id", async () => {
  const originalDateNow = Date.now;
  const generatedTimes = [1710000000000, 1710000000001];

  Date.now = () => generatedTimes.shift() ?? 1710000000002;

  try {
    const result = await registerUser({
      email: "client@example.com",
      role: "client"
    });
    const decoded = verifyAccessToken(result.token);

    assert.equal(result.id, "usr_1710000000000");
    assert.equal(decoded.sub, result.id);
    assert.equal(decoded.role, "client");
  } finally {
    Date.now = originalDateNow;
  }
});
