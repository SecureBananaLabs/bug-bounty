import test from "node:test";
import assert from "node:assert/strict";
import { registerSchema } from "../validators/auth.js";
import { refreshToken } from "../services/authService.js";
import { signAccessToken, verifyAccessToken } from "../utils/jwt.js";

test("registerSchema rejects public admin self-assignment", () => {
  assert.throws(() => {
    registerSchema.parse({
      email: "admin-attempt@example.com",
      password: "password123",
      role: "admin"
    });
  });
});

test("registerSchema still defaults public registrations to client", () => {
  const payload = registerSchema.parse({
    email: "client@example.com",
    password: "password123"
  });

  assert.equal(payload.role, "client");
});

test("refreshToken preserves the verified token identity", async () => {
  const original = signAccessToken({ sub: "usr_123", role: "freelancer" });
  const refreshed = await refreshToken(original);
  const payload = verifyAccessToken(refreshed.token);

  assert.equal(payload.sub, "usr_123");
  assert.equal(payload.role, "freelancer");
});
