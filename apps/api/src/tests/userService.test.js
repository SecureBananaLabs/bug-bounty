import test from "node:test";
import assert from "node:assert/strict";
import { createUser, listUsers } from "../services/userService.js";

test("createUser omits submitted password material from stored users", async () => {
  const user = await createUser({
    email: "user@example.com",
    fullName: "Example User",
    password: "super-secret",
    passwordHash: "already-secret"
  });

  assert.equal(user.password, undefined);
  assert.equal(user.passwordHash, undefined);
  assert.equal(user.email, "user@example.com");
  assert.equal(user.fullName, "Example User");

  const users = await listUsers();
  const storedUser = users.find((candidate) => candidate.id === user.id);

  assert.ok(storedUser);
  assert.equal(storedUser.password, undefined);
  assert.equal(storedUser.passwordHash, undefined);
});
