import test from "node:test";
import assert from "node:assert/strict";
import { createUserSchema } from "../validators/user.js";

test("createUserSchema accepts valid payload", () => {
  const result = createUserSchema.safeParse({
    email: "test@example.com",
    password: "password123",
    firstName: "John",
    lastName: "Doe",
    role: "client"
  });
  assert.equal(result.success, true);
});

test("createUserSchema rejects invalid email", () => {
  const result = createUserSchema.safeParse({
    email: "invalid-email",
    password: "password123",
    firstName: "John",
    lastName: "Doe"
  });
  assert.equal(result.success, false);
});
