import test from "node:test";
import assert from "node:assert/strict";
import { registerUser } from "../services/authService.js";
import { verifyAccessToken } from "../utils/jwt.js";

test("registerUser signs token subject with the returned user id", async () => {
  const originalNow = Date.now;
  let tick = 1000;
  Date.now = () => tick++;

  try {
    const result = await registerUser({
      email: "new-user@example.com",
      password: "correct-horse-battery-staple",
      role: "client"
    });

    const claims = verifyAccessToken(result.token);

    assert.equal(result.id, "usr_1000");
    assert.equal(claims.sub, result.id);
    assert.equal(claims.role, result.role);
  } finally {
    Date.now = originalNow;
  }
});
