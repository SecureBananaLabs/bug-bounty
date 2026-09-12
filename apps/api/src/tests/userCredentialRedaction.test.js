import test from "node:test";
import assert from "node:assert/strict";

import { createUser, listUsers } from "../services/userService.js";

test("createUser and listUsers omit credential fields", async () => {
  const email = `credential-redaction-${Date.now()}@example.com`;
  const created = await createUser({
    email,
    fullName: "Credential Redaction Test",
    bio: "public profile",
    role: "client",
    password: "plaintext-secret",
    passwordHash: "hashed-secret",
    token: "session-secret",
    accessToken: "access-secret",
    refreshToken: "refresh-secret",
    resetToken: "reset-secret",
    apiKey: "api-secret"
  });

  assert.equal(created.email, email);
  assert.equal(created.fullName, "Credential Redaction Test");
  assert.equal(created.bio, "public profile");
  assert.equal(created.role, "client");

  for (const key of [
    "password",
    "passwordHash",
    "token",
    "accessToken",
    "refreshToken",
    "resetToken",
    "apiKey"
  ]) {
    assert.equal(key in created, false, `${key} should not be returned from createUser`);
  }

  const listed = (await listUsers()).find((user) => user.email === email);
  assert.ok(listed, "created user should appear in listUsers");

  for (const key of [
    "password",
    "passwordHash",
    "token",
    "accessToken",
    "refreshToken",
    "resetToken",
    "apiKey"
  ]) {
    assert.equal(key in listed, false, `${key} should not be exposed by listUsers`);
  }
});
