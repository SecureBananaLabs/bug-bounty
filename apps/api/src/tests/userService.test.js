import test from "node:test";
import assert from "node:assert/strict";
import { createUser } from "../services/userService.js";

test("createUser omits password fields from created users", async () => {
  const user = await createUser({
    email: "user@example.com",
    password: "super-secret",
    fullName: "Test User",
    role: "client"
  });

  assert.equal(user.email, "user@example.com");
  assert.equal(user.fullName, "Test User");
  assert.equal(user.role, "client");
  assert.ok(user.id.startsWith("usr_"));
  assert.equal("password" in user, false);
});
