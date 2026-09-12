import test from "node:test";
import assert from "node:assert/strict";
import { ZodError } from "zod";
import { registerSchema } from "../validators/auth.js";

const validBasePayload = {
  email: "new-user@example.com",
  password: "password123"
};

test("registerSchema defaults missing role to client", () => {
  const payload = registerSchema.parse(validBasePayload);

  assert.equal(payload.role, "client");
});

test("registerSchema accepts public registration roles", () => {
  for (const role of ["client", "freelancer"]) {
    const payload = registerSchema.parse({ ...validBasePayload, role });

    assert.equal(payload.role, role);
  }
});

test("registerSchema rejects admin self-assignment", () => {
  assert.throws(
    () => registerSchema.parse({ ...validBasePayload, role: "admin" }),
    ZodError
  );
});
