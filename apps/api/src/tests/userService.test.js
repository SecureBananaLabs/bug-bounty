import test from "node:test";
import assert from "node:assert/strict";
import { createUser, listUsers } from "../services/userService.js";

test("createUser strips sensitive credential fields from the response and store", async () => {
  const user = await createUser({
    email: "safe-user@example.com",
    fullName: "Safe User",
    role: "CLIENT",
    password: "plain-text-password",
    passwordHash: "hashed-password",
    token: "access-token",
    refreshToken: "refresh-token"
  });

  assert.equal(user.email, "safe-user@example.com");
  assert.equal(user.fullName, "Safe User");
  assert.equal(user.role, "CLIENT");
  assert.equal(user.password, undefined);
  assert.equal(user.passwordHash, undefined);
  assert.equal(user.token, undefined);
  assert.equal(user.refreshToken, undefined);

  const users = await listUsers();
  const storedUser = users.find((entry) => entry.id === user.id);

  assert.ok(storedUser);
  assert.equal(storedUser.password, undefined);
  assert.equal(storedUser.passwordHash, undefined);
  assert.equal(storedUser.token, undefined);
  assert.equal(storedUser.refreshToken, undefined);
});
