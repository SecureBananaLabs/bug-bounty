import test from "node:test";
import assert from "node:assert/strict";
import { registerUser } from "../services/authService.js";
import { verifyAccessToken } from "../utils/jwt.js";

test("registerUser reuses the returned user id as the token subject", async () => {
  const originalNow = Date.now;
  let calls = 0;
  Date.now = () => (calls++ === 0 ? 1_000 : 2_000);

  try {
    const result = await registerUser({
      email: "person@example.com",
      role: "client"
    });
    const claims = verifyAccessToken(result.token);

    assert.equal(result.id, "usr_1000");
    assert.equal(claims.sub, result.id);
  } finally {
    Date.now = originalNow;
  }
});
