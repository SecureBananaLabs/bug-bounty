import test from "node:test";
import assert from "node:assert/strict";
import { registerUser } from "../services/authService.js";
import { verifyAccessToken } from "../utils/jwt.js";

test("register user keeps response id and token subject in sync", async () => {
  const originalDateNow = Date.now;
  let callCount = 0;
  Date.now = () => (callCount += 1) === 1 ? 1000 : 2000;

  try {
    const result = await registerUser({
      email: "user@example.com",
      password: "password123",
      role: "client"
    });

    const decoded = verifyAccessToken(result.token);

    assert.equal(result.id, "usr_1000");
    assert.equal(decoded.sub, result.id);
    assert.equal(decoded.role, "client");
  } finally {
    Date.now = originalDateNow;
  }
});
