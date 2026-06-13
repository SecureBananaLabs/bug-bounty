import test from "node:test";
import assert from "node:assert/strict";
import { createUser, listUsers } from "../services/userService.js";

test("createUser does not store submitted passwords", async () => {
  const user = await createUser({
    email: "user@example.com",
    fullName: "Test User",
    role: "client",
    password: "super-secret"
  });
  const users = await listUsers();
  const storedUser = users.find((candidate) => candidate.id === user.id);

  assert.equal(user.password, undefined);
  assert.equal(storedUser.password, undefined);
  assert.equal(user.email, "user@example.com");
  assert.equal(user.fullName, "Test User");
  assert.equal(user.role, "client");
});
