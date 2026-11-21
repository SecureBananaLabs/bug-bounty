import test from "node:test";
import assert from "node:assert/strict";

import { registerUser } from "../services/authService.js";
import { verifyAccessToken } from "../utils/jwt.js";

test("registration token subject matches the returned user id", async () => {
  // Force every Date.now() call to advance by 1ms so that a second call would
  // produce a different id. This makes the regression detectable even though
  // two real back-to-back calls almost always land on the same millisecond.
  const originalNow = Date.now;
  let tick = originalNow();
  Date.now = () => tick++;

  try {
    const result = await registerUser({
      email: "new@example.com",
      role: "client"
    });

    const decoded = verifyAccessToken(result.token);
    assert.equal(decoded.sub, result.id);
  } finally {
    Date.now = originalNow;
  }
});
