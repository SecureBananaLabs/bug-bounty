import test from "node:test";
import assert from "node:assert/strict";
import { registerUser } from "../services/authService.js";
import { verifyAccessToken } from "../utils/jwt.js";

test("registerUser signs access token for the returned user id", async () => {
  const originalDateNow = Date.now;
  let timestamp = 1_700_000_000_000;

  Date.now = () => timestamp++;

  try {
    const result = await registerUser({
      email: "new-user@example.com",
      role: "client"
    });

    const tokenPayload = verifyAccessToken(result.token);

    assert.equal(result.id, "usr_1700000000000");
    assert.equal(tokenPayload.sub, result.id);
  } finally {
    Date.now = originalDateNow;
  }
});
