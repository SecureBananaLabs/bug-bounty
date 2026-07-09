import test from "node:test";
import assert from "node:assert/strict";
import { createUser, listUsers } from "../services/userService.js";

test("createUser redacts password and passwordHash", async () => {
  const payload = {
    fullName: "John Doe",
    email: "john@example.com",
    role: "client",
    password: "secretpassword123",
    passwordHash: "hashedsecretvalue"
  };

  const user = await createUser(payload);

  assert.equal(user.fullName, "John Doe");
  assert.equal(user.email, "john@example.com");
  assert.equal(user.role, "client");
  assert.equal(user.password, undefined);
  assert.equal(user.passwordHash, undefined);

  const users = await listUsers();
  const savedUser = users.find((u) => u.email === "john@example.com");
  assert.ok(savedUser);
  assert.equal(savedUser.password, undefined);
  assert.equal(savedUser.passwordHash, undefined);
});
