import test from "node:test";
import assert from "node:assert/strict";
import { registerUser } from "../services/authService.js";
import { verifyAccessToken } from "../utils/jwt.js";

test("registerUser returns token whose sub matches the returned id", async () => {
  const result = await registerUser({ email: "x@x.com", password: "password123", role: "client" });
  const decoded = verifyAccessToken(result.token);
  assert.equal(decoded.sub, result.id);
});
