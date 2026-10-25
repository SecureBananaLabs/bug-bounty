import test from "node:test";
import assert from "node:assert/strict";
import { registerUser } from "../services/authService.js";
import { registerSchema } from "../validators/auth.js";

test("registerSchema requires a non-empty fullName", () => {
  const withoutName = registerSchema.safeParse({
    email: "client@example.com",
    password: "supersecret",
    role: "client"
  });
  const blankName = registerSchema.safeParse({
    fullName: "   ",
    email: "client@example.com",
    password: "supersecret",
    role: "client"
  });

  assert.equal(withoutName.success, false);
  assert.equal(blankName.success, false);
});

test("registerUser preserves the validated fullName", async () => {
  const payload = registerSchema.parse({
    fullName: "  Maya Patel  ",
    email: "maya@example.com",
    password: "supersecret",
    role: "freelancer"
  });
  const result = await registerUser(payload);

  assert.equal(payload.fullName, "Maya Patel");
  assert.equal(result.fullName, "Maya Patel");
  assert.equal(result.email, "maya@example.com");
  assert.equal(result.role, "freelancer");
});
