import test from "node:test";
import assert from "node:assert/strict";
import { registerUser } from "../services/authService.js";
import { registerSchema } from "../validators/auth.js";

const validRegistration = {
  email: "client@example.com",
  fullName: "Avery Client",
  password: "correct-horse-battery-staple",
  role: "client"
};

test("registerSchema rejects missing fullName", () => {
  const payload = { ...validRegistration };
  delete payload.fullName;

  assert.equal(registerSchema.safeParse(payload).success, false);
});

test("registerSchema rejects blank fullName", () => {
  const payload = { ...validRegistration, fullName: "   " };

  assert.equal(registerSchema.safeParse(payload).success, false);
});

test("registerUser preserves validated fullName in returned user payload", async () => {
  const payload = registerSchema.parse(validRegistration);
  const result = await registerUser(payload);

  assert.equal(result.email, "client@example.com");
  assert.equal(result.fullName, "Avery Client");
  assert.equal(result.role, "client");
  assert.match(result.token, /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
});
