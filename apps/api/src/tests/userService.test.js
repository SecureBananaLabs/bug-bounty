import test from "node:test";
import assert from "node:assert/strict";
import { createUser } from "../services/userService.js";

test("createUser omits password fields from returned users", async () => {
  const user = await createUser({
    email: "client@example.com",
    role: "client",
    fullName: "Client Example",
    password: "plaintext-secret",
    passwordHash: "hashed-secret"
  });

  assert.match(user.id, /^usr_/);
  assert.equal(user.email, "client@example.com");
  assert.equal(user.role, "client");
  assert.equal(user.fullName, "Client Example");
  assert.equal("password" in user, false);
  assert.equal("passwordHash" in user, false);
});
