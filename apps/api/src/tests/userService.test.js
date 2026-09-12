import test from "node:test";
import assert from "node:assert/strict";
import { createUser } from "../services/userService.js";

test("createUser keeps id and verification status server-owned", async () => {
  const user = await createUser({
    id: "usr_attacker",
    email: "freelancer@example.com",
    fullName: "Freelancer Example",
    role: "freelancer",
    isVerified: true
  });

  assert.match(user.id, /^usr_\d+$/);
  assert.notEqual(user.id, "usr_attacker");
  assert.equal(user.isVerified, false);
  assert.equal(user.email, "freelancer@example.com");
  assert.equal(user.fullName, "Freelancer Example");
  assert.equal(user.role, "freelancer");
});
