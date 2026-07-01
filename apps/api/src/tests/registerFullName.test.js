import test from "node:test";
import assert from "node:assert/strict";
import { registerUser } from "../services/authService.js";
import { registerSchema } from "../validators/auth.js";

test("registration requires a full name", () => {
  const result = registerSchema.safeParse({
    email: "client@example.com",
    password: "correct-horse"
  });

  assert.equal(result.success, false);
});

test("registration rejects a blank full name", () => {
  const result = registerSchema.safeParse({
    email: "client@example.com",
    password: "correct-horse",
    fullName: "   "
  });

  assert.equal(result.success, false);
});

test("registerUser returns the submitted full name", async () => {
  const user = await registerUser({
    email: "client@example.com",
    password: "correct-horse",
    fullName: "Ada Lovelace",
    role: "client"
  });

  assert.equal(user.fullName, "Ada Lovelace");
});
