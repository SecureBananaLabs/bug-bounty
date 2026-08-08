import test from "node:test";
import assert from "node:assert/strict";
import { createUser, listUsers } from "../services/userService.js";

const sensitiveFields = ["password", "passwordHash", "token", "resetToken"];

test("createUser omits sensitive credential fields", async () => {
  const user = await createUser({
    email: "user@example.com",
    name: "Test User",
    role: "client",
    password: "secret-password",
    passwordHash: "hashed-password",
    token: "access-token",
    resetToken: "reset-token"
  });

  assert.equal(user.email, "user@example.com");
  assert.equal(user.name, "Test User");
  assert.equal(user.role, "client");

  for (const field of sensitiveFields) {
    assert.equal(field in user, false);
  }
});

test("listUsers does not expose stripped sensitive fields", async () => {
  const users = await listUsers();
  const storedUser = users.find((user) => user.email === "user@example.com");

  assert.ok(storedUser);
  for (const field of sensitiveFields) {
    assert.equal(field in storedUser, false);
  }
});
