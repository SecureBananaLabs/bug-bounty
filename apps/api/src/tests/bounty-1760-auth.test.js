import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { registerUser } from "../services/authService.js";

const JWT_SECRET = "test-secret";

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "15m" });
}

test("registerUser id matches token sub", async () => {
  const result = await registerUser({
    email: "test@example.com",
    password: "password123",
    role: "client"
  });
  const decoded = jwt.decode(result.token);
  assert.equal(decoded.sub, result.id);
});
