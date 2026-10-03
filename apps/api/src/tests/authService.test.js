import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { registerUser, loginUser, refreshToken } from "../services/authService.js";

test("registerUser returns id matching jwt sub", async () => {
  const payload = { email: "test@test.com", role: "client" };
  const result = await registerUser(payload);
  const decoded = jwt.verify(result.token, env.jwtSecret);
  assert.equal(decoded.sub, result.id);
});

test("registerUser token sub matches id even when Date.now advances between calls", async () => {
  const originalNow = Date.now;
  let callCount = 0;
  Date.now = () => {
    callCount++;
    return 1700000000000 + (callCount > 1 ? 2 : 0);
  };

  const payload = { email: "advance@test.com", role: "freelancer" };
  const result = await registerUser(payload);
  const decoded = jwt.verify(result.token, env.jwtSecret);

  assert.equal(decoded.sub, result.id);
  assert.notEqual(callCount, 0);

  Date.now = originalNow;
});
