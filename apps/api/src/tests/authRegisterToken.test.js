import test from "node:test";
import assert from "node:assert/strict";
import { registerUser } from "../services/authService.js";
import { verifyAccessToken } from "../utils/jwt.js";

test("registerUser signs the access token with the returned user id", async () => {
  const originalNow = Date.now;
  let timestamp = 1710000000000;
  Date.now = () => timestamp++;

  try {
    const result = await registerUser({
      email: "new-user@example.com",
      role: "client"
    });
    const tokenPayload = verifyAccessToken(result.token);

    assert.equal(result.id, "usr_1710000000000");
    assert.equal(tokenPayload.sub, result.id);
    assert.equal(tokenPayload.role, "client");
  } finally {
    Date.now = originalNow;
  }
});
