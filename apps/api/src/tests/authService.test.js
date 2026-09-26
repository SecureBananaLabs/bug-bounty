import test from "node:test";
import assert from "node:assert/strict";
import { registerUser } from "../services/authService.js";
import { verifyAccessToken } from "../utils/jwt.js";

test("registerUser signs a token for the same generated user id", async () => {
  const originalNow = Date.now;
  let calls = 0;

  Date.now = () => {
    calls += 1;
    return calls === 1 ? 1700000000000 : 1700000000001;
  };

  try {
    const result = await registerUser({
      email: "user@example.com",
      password: "password123",
      role: "freelancer"
    });

    const tokenPayload = verifyAccessToken(result.token);

    assert.equal(result.id, "usr_1700000000000");
    assert.equal(tokenPayload.sub, result.id);
    assert.equal(tokenPayload.role, "freelancer");
  } finally {
    Date.now = originalNow;
  }
});
