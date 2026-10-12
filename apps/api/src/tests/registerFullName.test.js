import test from "node:test";
import assert from "node:assert/strict";
import { registerSchema } from "../validators/auth.js";

test("register accepts a trimmed fullName", () => {
  const result = registerSchema.parse({
    fullName: "  Ada Lovelace ",
    email: "ada@example.com",
    password: "supersecret"
  });

  assert.equal(result.fullName, "Ada Lovelace");
  assert.equal(result.role, "client");
});

test("register rejects a missing fullName", () => {
  assert.throws(() =>
    registerSchema.parse({
      email: "ada@example.com",
      password: "supersecret"
    })
  );
});

test("register rejects a blank fullName", () => {
  assert.throws(() =>
    registerSchema.parse({
      fullName: "   ",
      email: "ada@example.com",
      password: "supersecret"
    })
  );
});
