import test from "node:test";
import assert from "node:assert/strict";
import { createUser, listUsers } from "../services/userService.js";

test("createUser omits password fields from stored and returned users", async () => {
  const user = await createUser({
    email: "santi@example.com",
    fullName: "Santi",
    password: "plain-text-password",
    passwordHash: "hashed-password",
    role: "client"
  });

  assert.equal(user.email, "santi@example.com");
  assert.equal(user.fullName, "Santi");
  assert.equal(user.role, "client");
  assert.equal("password" in user, false);
  assert.equal("passwordHash" in user, false);

  const users = await listUsers();
  const storedUser = users.find((item) => item.email === "santi@example.com");

  assert.ok(storedUser);
  assert.equal("password" in storedUser, false);
  assert.equal("passwordHash" in storedUser, false);
});
