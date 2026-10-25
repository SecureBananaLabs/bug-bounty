import test from "node:test";
import assert from "node:assert/strict";
import { createUser, listUsers } from "../services/userService.js";

test("userService - createUser does not store password", async () => {
  const payload = {
    username: "john_doe",
    email: "john@example.com",
    password: "super_secret_password_123",
  };

  const user = await createUser(payload);

  // Check returned object
  assert.equal(user.username, "john_doe");
  assert.equal(user.email, "john@example.com");
  assert.equal(user.password, undefined);

  // Check stored in list
  const users = await listUsers();
  const foundUser = users.find((u) => u.id === user.id);
  assert.ok(foundUser);
  assert.equal(foundUser.username, "john_doe");
  assert.equal(foundUser.password, undefined);
});
