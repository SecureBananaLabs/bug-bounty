import test from "node:test";
import assert from "node:assert/strict";
import { registerSchema } from "../validators/auth.js";

test("registerSchema rejects admin role", () => {
  const result = registerSchema.safeParse({
    email: "attacker@example.com",
    password: "Password123!",
    role: "admin"
  });

  assert.equal(result.success, false);
  assert.equal(result.error.issues[0].path[0], "role");
});
