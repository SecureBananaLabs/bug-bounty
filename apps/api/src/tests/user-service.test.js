import test from "node:test";
import assert from "node:assert/strict";
import { createUser, listUsers } from "../services/userService.js";

test("listUsers redacts password and credential fields", async () => {
  const email = `redacted-${Date.now()}@example.com`;

  await createUser({
    email,
    role: "client",
    password: "plain-secret",
    passwordHash: "hashed-secret",
    accessToken: "access-token",
    refreshToken: "refresh-token"
  });

  const listedUsers = await listUsers();
  const listedUser = listedUsers.find((user) => user.email === email);

  assert.ok(listedUser);
  assert.equal(listedUser.role, "client");
  assert.equal(listedUser.password, undefined);
  assert.equal(listedUser.passwordHash, undefined);
  assert.equal(listedUser.accessToken, undefined);
  assert.equal(listedUser.refreshToken, undefined);
});
