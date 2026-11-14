import test from "node:test";
import assert from "node:assert/strict";
import { createUser } from "../services/userService.js";

test("createUser persists only the public user fields", async () => {
  const user = await createUser({
    email: "ada@example.com",
    fullName: "Ada Lovelace",
    bio: "Mathematician",
    role: "freelancer",
    password: "plain-text-secret",
    isAdmin: true
  });

  assert.match(user.id, /^usr_/);
  assert.deepEqual(Object.keys(user).sort(), ["bio", "email", "fullName", "id", "role"]);
  assert.equal("password" in user, false);
  assert.equal("isAdmin" in user, false);
});

test("createUser never polls the prototype with attacker keys", async () => {
  const payload = JSON.parse('{"email":"ada@example.com","fullName":"Ada Lovelace","__proto__":{"polluted":true}}');
  const user = await createUser(payload);

  assert.equal({}.polluted, undefined);
  assert.equal(Object.getPrototypeOf(user), Object.prototype);
  assert.equal("polluted" in user, false);
});
