import test from "node:test";
import assert from "node:assert/strict";
import { createUser, listUsers } from "../services/userService.js";

test("createUser does not store submitted passwords", async () => {
  const created = await createUser({
    email: "alice@example.com",
    name: "Alice",
    password: "super-secret"
  });
  const users = await listUsers();
  const stored = users.find((user) => user.id === created.id);

  assert.equal(created.email, "alice@example.com");
  assert.equal(created.name, "Alice");
  assert.equal(Object.hasOwn(created, "password"), false);
  assert.equal(Object.hasOwn(stored, "password"), false);
});