import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { registerUser } from "../services/authService.js";

test("registerUser signs access token with the returned user id as subject", async () => {
  const result = await registerUser({
    email: "new-client@example.com",
    password: "correct-horse-battery-staple",
    role: "client"
  });

  const decoded = jwt.verify(result.token, env.jwtSecret);

  assert.equal(decoded.sub, result.id);
  assert.equal(decoded.role, result.role);
});