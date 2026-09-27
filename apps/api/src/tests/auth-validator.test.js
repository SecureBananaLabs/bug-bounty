import test from "node:test";
import assert from "node:assert/strict";
import { registerSchema } from "../validators/auth.js";

const basePayload = {
  email: "new-user@example.com",
  password: "correct-horse-battery"
};

test("registerSchema allows public client and freelancer registration", () => {
  assert.equal(registerSchema.parse(basePayload).role, "client");
  assert.equal(registerSchema.parse({ ...basePayload, role: "client" }).role, "client");
  assert.equal(registerSchema.parse({ ...basePayload, role: "freelancer" }).role, "freelancer");
});

test("registerSchema rejects public admin self-registration", () => {
  assert.throws(
    () => registerSchema.parse({ ...basePayload, role: "admin" }),
    /Invalid enum value/
  );
});
