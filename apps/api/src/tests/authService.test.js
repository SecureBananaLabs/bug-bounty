import test from "node:test";
import assert from "node:assert/strict";
import { registerUser } from "../services/authService.js";
import { verifyAccessToken } from "../utils/jwt.js";

test("registerUser signs token with the returned user id", async () => {
  const originalNow = Date.now;
  const firstTimestamp = originalNow();
  const timestamps = [firstTimestamp, firstTimestamp + 1];

  Date.now = () => timestamps.shift() ?? originalNow();

  try {
    const result = await registerUser({
      email: "new-user@example.com",
      role: "client"
    });
    const tokenPayload = verifyAccessToken(result.token);

    assert.equal(result.id, `usr_${firstTimestamp}`);
    assert.equal(tokenPayload.sub, result.id);
    assert.equal(tokenPayload.role, "client");
  } finally {
    Date.now = originalNow;
  }
});
