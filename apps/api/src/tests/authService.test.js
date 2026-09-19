import test from "node:test";
import assert from "node:assert/strict";
import { registerUser } from "../services/authService.js";
import { verifyAccessToken } from "../utils/jwt.js";

test("registerUser signs token subject with the returned user id", async () => {
  const originalDateNow = Date.now;
  const timestamps = [1710000000000, 1710000000001, 1710000000002];
  let index = 0;

  Date.now = () => timestamps[index++] ?? timestamps.at(-1);

  try {
    const result = await registerUser({
      email: "client@example.com",
      password: "password123",
      role: "client"
    });

    const decoded = verifyAccessToken(result.token);

    assert.equal(decoded.sub, result.id);
  } finally {
    Date.now = originalDateNow;
  }
});
