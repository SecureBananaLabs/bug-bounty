import test from "node:test";
import assert from "node:assert/strict";
import { createUser } from "../services/userService.js";

test("createUser does not store submitted password fields", async () => {
  const user = await createUser({
    email: "client@example.com",
    role: "client",
    password: "supersecret"
  });

  assert.equal(user.email, "client@example.com");
  assert.equal(user.role, "client");
  assert.equal("password" in user, false);
});
