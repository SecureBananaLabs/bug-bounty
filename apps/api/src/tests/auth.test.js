import test from "node:test";
import assert from "node:assert/strict";
import { registerUser } from "../services/authService.js";
import { registerSchema } from "../validators/auth.js";

test("registration requires a full name", () => {
  assert.throws(() =>
    registerSchema.parse({
      email: "maya@example.com",
      password: "strong-password"
    })
  );
});

test("registration preserves a valid full name", async () => {
  const payload = registerSchema.parse({
    fullName: "Maya Patel",
    email: "maya@example.com",
    password: "strong-password",
    role: "freelancer"
  });

  const result = await registerUser(payload);

  assert.equal(result.fullName, "Maya Patel");
});
