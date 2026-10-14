import test from "node:test";
import assert from "node:assert/strict";
import { registerUser } from "../services/authService.js";
import { verifyAccessToken } from "../utils/jwt.js";

test("registerUser reuses the same generated user id in the access token", async () => {
  const originalDateNow = Date.now;
  let calls = 0;

  Date.now = () => ++calls;

  try {
    const result = await registerUser({
      email: "ada@example.com",
      password: "super-secret",
      role: "freelancer"
    });

    const claims = verifyAccessToken(result.token);

    assert.equal(result.id, "usr_1");
    assert.equal(claims.sub, result.id);
    assert.equal(claims.role, "freelancer");
  } finally {
    Date.now = originalDateNow;
  }
});
