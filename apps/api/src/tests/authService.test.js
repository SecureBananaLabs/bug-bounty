import assert from "node:assert/strict";
import test from "node:test";

import { registerUser } from "../services/authService.js";
import { verifyAccessToken } from "../utils/jwt.js";

test("registerUser signs token subject with the returned user id", async () => {
  const originalNow = Date.now;
  let calls = 0;

  Date.now = () => {
    calls += 1;
    return calls === 1 ? 1000 : 2000;
  };

  try {
    const result = await registerUser({
      email: "client@example.com",
      password: "password123",
      role: "client"
    });
    const decoded = verifyAccessToken(result.token);

    assert.equal(result.id, "usr_1000");
    assert.equal(decoded.sub, result.id);
    assert.equal(decoded.role, "client");
  } finally {
    Date.now = originalNow;
  }
});
