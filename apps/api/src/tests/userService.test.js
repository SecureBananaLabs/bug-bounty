import test from "node:test";
import assert from "node:assert/strict";
import { createUser } from "../services/userService.js";

test("createUser keeps user ids server-generated", async () => {
  const user = await createUser({
    id: "attacker_id",
    email: "user@example.com",
    fullName: "Test User",
    role: "client",
  });

  assert.match(user.id, /^usr_\d+$/);
  assert.notEqual(user.id, "attacker_id");
  assert.equal(user.email, "user@example.com");
  assert.equal(user.fullName, "Test User");
  assert.equal(user.role, "client");
});
