import test from "node:test";
import assert from "node:assert/strict";

import { createUser, listUsers } from "../services/userService.js";

test("createUser strips password from stored and returned user records", async () => {
  const created = await createUser({
    email: "user@example.com",
    role: "client",
    password: "super-secret",
    displayName: "Test User"
  });

  assert.equal(created.email, "user@example.com");
  assert.equal(created.role, "client");
  assert.equal(created.displayName, "Test User");
  assert.equal("password" in created, false);

  const users = await listUsers();
  assert.equal(users.length, 1);
  assert.equal(users[0].email, "user@example.com");
  assert.equal(users[0].role, "client");
  assert.equal(users[0].displayName, "Test User");
  assert.equal("password" in users[0], false);
});
