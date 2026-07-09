import test from "node:test";
import assert from "node:assert/strict";
import { registerSchema } from "../validators/auth.js";
import { registerUser } from "../services/authService.js";

test("register schema requires fullName", () => {
  assert.throws(() => {
    registerSchema.parse({
      email: "client@example.com",
      password: "password123",
      role: "client"
    });
  });
});

test("register user preserves validated fullName", async () => {
  const payload = registerSchema.parse({
    email: "client@example.com",
    fullName: "Client Example",
    password: "password123",
    role: "client"
  });

  const user = await registerUser(payload);

  assert.equal(user.email, "client@example.com");
  assert.equal(user.fullName, "Client Example");
  assert.equal(user.role, "client");
  assert.equal(typeof user.token, "string");
});
