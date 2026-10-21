import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { registerUser } from "../services/authService.js";

test("registerUser uses the same generated id for the response and JWT subject", async () => {
  const originalNow = Date.now;
  let callCount = 0;
  Date.now = () => {
    callCount += 1;
    return callCount === 1 ? 1000 : 2000;
  };

  try {
    const result = await registerUser({
      email: "new-user@example.com",
      role: "client",
      password: "password123"
    });
    const payload = jwt.verify(result.token, env.jwtSecret);

    assert.equal(result.id, "usr_1000");
    assert.equal(payload.sub, result.id);
  } finally {
    Date.now = originalNow;
  }
});
