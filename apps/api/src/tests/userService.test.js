import test from "node:test";
import assert from "node:assert/strict";
import { createUser, listUsers } from "../services/userService.js";

test("createUser ignores client-controlled id values", async () => {
  const created = await createUser({
    id: "attacker",
    email: "person@example.com",
    fullName: "Test Person",
    role: "client"
  });

  assert.notEqual(created.id, "attacker");
  assert.match(created.id, /^usr_/);
  assert.deepEqual(created, {
    id: created.id,
    email: "person@example.com",
    fullName: "Test Person",
    role: "client"
  });
  const users = await listUsers();

  assert.ok(Array.isArray(users));
  assert.ok(users.length >= 1);
  assert.notEqual(users[users.length - 1].id, "attacker");
  assert.equal(users[users.length - 1].id, created.id);
});
