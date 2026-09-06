import test from "node:test";
import assert from "node:assert/strict";
import { registerSchema } from "../validators/auth.js";

test("registerSchema rejects admin role", () => {
  assert.throws(() => {
    registerSchema.parse({ email: "a@b.com", password: "12345678", role: "admin" });
  }, /Invalid enum value/);
});

test("registerSchema allows client role", () => {
  const result = registerSchema.parse({ email: "a@b.com", password: "12345678", role: "client" });
  assert.equal(result.role, "client");
});

test("registerSchema allows freelancer role", () => {
  const result = registerSchema.parse({ email: "a@b.com", password: "12345678", role: "freelancer" });
  assert.equal(result.role, "freelancer");
});

test("registerSchema defaults to client when role omitted", () => {
  const result = registerSchema.parse({ email: "a@b.com", password: "12345678" });
  assert.equal(result.role, "client");
});
