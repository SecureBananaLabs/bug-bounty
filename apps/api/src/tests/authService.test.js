import test from "node:test";
import assert from "node:assert/strict";
import { jwtVerify } from "jsonwebtoken";
import { registerUser } from "../services/authService.js";
import { jwtSecret } from "../config/env.js";

test("registerUser returns a token whose sub matches the returned user id", async () => {
  const payload = { email: "a@b.com", fullName: "A B", role: "client" };
  const result = await registerUser(payload);

  assert.ok(result.id.startsWith("usr_"));
  assert.ok(result.token);

  const decoded = jwtVerify(result.token, jwtSecret);

  assert.equal(decoded.sub, result.id);
});