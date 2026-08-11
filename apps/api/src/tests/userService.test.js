import test from "node:test";
import assert from "node:assert/strict";
import { createUser } from "../services/userService.js";

test("createUser keeps user ids server-owned", async () => {
  const user = await createUser({
    id: "usr_attacker",
    email: "user@example.com",
    name: "User"
  });

  assert.match(user.id, /^usr_\d+$/);
  assert.notEqual(user.id, "usr_attacker");
  assert.equal(user.email, "user@example.com");
  assert.equal(user.name, "User");
});
