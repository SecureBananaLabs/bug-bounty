import test from "node:test";
import assert from "node:assert/strict";
import { registerUser } from "../services/authService.js";
import { verifyAccessToken } from "../utils/jwt.js";

test("registerUser signs the access token with the returned user id", async () => {
  const originalNow = Date.now;
  Date.now = () => 1700000000000;

  try {
    const result = await registerUser({
      email: "new-user@example.com",
      role: "client"
    });
    const decoded = verifyAccessToken(result.token);

    assert.equal(result.id, "usr_1700000000000");
    assert.equal(decoded.sub, result.id);
    assert.equal(decoded.role, "client");
  } finally {
    Date.now = originalNow;
  }
});
