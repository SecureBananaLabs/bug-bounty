import test from "node:test";
import assert from "node:assert/strict";
import { createUser, listUsers } from "../services/userService.js";

test("createUser omits password fields from public users", async () => {
  const user = await createUser({
    email: "safe@example.com",
    fullName: "Safe User",
    password: "password123"
  });
  const users = await listUsers();

  assert.equal("password" in user, false);
  assert.ok(users.some((storedUser) => storedUser.email === "safe@example.com"));
  assert.equal(users.some((storedUser) => "password" in storedUser), false);
});
