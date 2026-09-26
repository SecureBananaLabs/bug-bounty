import test from "node:test";
import assert from "node:assert/strict";
import { registerUser } from "../services/authService.js";
import { verifyAccessToken } from "../utils/jwt.js";

test("registerUser signs the token for the same user id it returns", async () => {
  const originalDateNow = Date.now;
  let callCount = 0;

  Date.now = () => {
    callCount += 1;
    return callCount === 1 ? 1000 : 1001;
  };

  try {
    const result = await registerUser({
      email: "new-user@example.com",
      password: "password123",
      role: "freelancer"
    });
    const decoded = verifyAccessToken(result.token);

    assert.equal(result.id, "usr_1000");
    assert.equal(decoded.sub, result.id);
    assert.equal(decoded.role, "freelancer");
  } finally {
    Date.now = originalDateNow;
  }
});
