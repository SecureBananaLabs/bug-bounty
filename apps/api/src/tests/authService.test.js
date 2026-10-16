import test from "node:test";
import assert from "node:assert/strict";
import { registerUser } from "../services/authService.js";
import { verifyAccessToken } from "../utils/jwt.js";

test("registerUser signs token with the same user id it returns", async () => {
  const originalNow = Date.now;
  const calls = [1234567890, 1234567891];
  let index = 0;

  Date.now = () => calls[Math.min(index++, calls.length - 1)];

  try {
    const result = await registerUser({
      email: "test@example.com",
      password: "supersecret",
      role: "client"
    });

    const decoded = verifyAccessToken(result.token);

    assert.equal(result.id, "usr_1234567890");
    assert.equal(decoded.sub, result.id);
    assert.equal(decoded.role, "client");
  } finally {
    Date.now = originalNow;
  }
});
