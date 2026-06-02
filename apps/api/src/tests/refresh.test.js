import test from "node:test";
import assert from "node:assert/strict";
import { jwtVerify } from "jsonwebtoken";
import { refreshToken, signAccessToken } from "../services/authService.js";
import { jwtSecret } from "../config/env.js";

const mintAccessToken = signAccessToken;

test("refreshToken rejects empty token", async () => {
  let error;
  try {
    await refreshToken("");
  } catch (err) {
    error = err;
  }

  assert.ok(error instanceof Error);
  assert.equal(error.message, "Refresh token is required");
});

test("refreshToken rejects completely invalid token", async () => {
  let error;
  try {
    await refreshToken("not-a-token");
  } catch (err) {
    error = err;
  }

  assert.ok(error instanceof Error);
  assert.equal(error.message, "Invalid refresh token");
});

test("refreshToken rotates a valid refresh token and preserves subject/role", async () => {
  const original = mintAccessToken({ sub: "usr_123", role: "freelancer" });
  const result = await refreshToken(original);

  assert.ok(result.token);
  assert.notEqual(result.token, original);

  const decoded = jwtVerify(result.token, jwtSecret);
  assert.equal(decoded.sub, "usr_123");
  assert.equal(decoded.role, "freelancer");
});