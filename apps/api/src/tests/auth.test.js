import test from "node:test";
import assert from "node:assert/strict";
import { registerUser } from "../services/authService.js";
import { verifyAccessToken } from "../utils/jwt.js";

test("registerUser signs the token with the returned user id", async () => {
  const originalNow = Date.now;
  let calls = 0;

  Date.now = () => (calls++ === 0 ? 1710000000000 : 1710000000001);

  try {
    const result = await registerUser({
      email: "koala@example.com",
      password: "password123",
      role: "client"
    });
    const decoded = verifyAccessToken(result.token);

    assert.equal(result.id, "usr_1710000000000");
    assert.equal(decoded.sub, result.id);
    assert.equal(decoded.role, "client");
  } finally {
    Date.now = originalNow;
  }
});
