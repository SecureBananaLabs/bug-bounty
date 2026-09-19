import test from "node:test";
import assert from "node:assert/strict";
import { createUser } from "../services/userService.js";

test("createUser keeps the server-generated id when payload includes id", async () => {
  const user = await createUser({
    id: "usr_attacker",
    email: "creator@example.com",
    role: "client"
  });

  assert.match(user.id, /^usr_\d+$/);
  assert.notEqual(user.id, "usr_attacker");
  assert.equal(user.email, "creator@example.com");
  assert.equal(user.role, "client");
});
