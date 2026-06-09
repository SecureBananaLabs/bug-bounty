import test from "node:test";
import assert from "node:assert/strict";
import { registerUser } from "../services/authService.js";
import { verifyAccessToken } from "../utils/jwt.js";

test("registerUser signs token for the returned user id", async () => {
  const originalNow = Date.now;
  let nextTimestamp = originalNow();
  Date.now = () => nextTimestamp++;

  try {
    const result = await registerUser({
      email: "new-client@example.com",
      password: "correct-horse-battery",
      role: "client"
    });
    const decoded = verifyAccessToken(result.token);

    assert.equal(decoded.sub, result.id);
    assert.equal(decoded.role, result.role);
  } finally {
    Date.now = originalNow;
  }
});
