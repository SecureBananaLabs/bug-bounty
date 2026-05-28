import test from "node:test";
import assert from "node:assert/strict";
import { registerUser } from "../services/authService.js";
import { verifyAccessToken } from "../utils/jwt.js";

test("registerUser signs a token for the returned user id", async () => {
  const originalDateNow = Date.now;
  const timestamps = [1000, 2000];
  Date.now = () => timestamps.shift() ?? 3000;

  try {
    const result = await registerUser({
      email: "new.user@example.com",
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
