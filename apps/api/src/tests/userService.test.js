import test from "node:test";
import assert from "node:assert/strict";
import { createUser, listUsers } from "../services/userService.js";

test("listUsers omits password fields from returned records", async () => {
  const before = await listUsers();

  await createUser({
    email: "hidden@example.com",
    role: "client",
    password: "super-secret"
  });

  const users = await listUsers();
  const created = users[users.length - 1];

  assert.equal(users.length, before.length + 1);
  assert.equal(created.email, "hidden@example.com");
  assert.equal(created.role, "client");
  assert.equal("password" in created, false);
});
