import test from "node:test";
import assert from "node:assert/strict";
import { registerSchema } from "../validators/auth.js";
import { registerUser } from "../services/authService.js";
import { verifyAccessToken } from "../utils/jwt.js";

test("registerUser returns canonical Prisma UserRole values", async () => {
  const result = await registerUser({
    email: "client@example.com",
    password: "password123",
    role: "client"
  });
  const claims = verifyAccessToken(result.token);

  assert.equal(result.role, "CLIENT");
  assert.equal(claims.role, "CLIENT");
});

test("registerUser normalizes freelancer role claims", async () => {
  const result = await registerUser({
    email: "freelancer@example.com",
    password: "password123",
    role: "freelancer"
  });
  const claims = verifyAccessToken(result.token);

  assert.equal(result.role, "FREELANCER");
  assert.equal(claims.role, "FREELANCER");
});

test("public registration does not accept admin role", () => {
  assert.throws(() =>
    registerSchema.parse({
      email: "admin@example.com",
      password: "password123",
      role: "admin"
    })
  );
});
