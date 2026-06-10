import test from "node:test";
import assert from "node:assert/strict";
import { createUser, listUsers } from "../services/userService.js";

test("createUser does not store submitted passwords", async () => {
  const email = `password-check-${Date.now()}@example.com`;

  const user = await createUser({
    name: "Password Check",
    email,
    password: "super-secret-password"
  });

  assert.equal(user.name, "Password Check");
  assert.equal(user.email, email);
  assert.equal(Object.hasOwn(user, "password"), false);

  const storedUser = (await listUsers()).find((item) => item.email === email);

  assert.ok(storedUser);
  assert.equal(Object.hasOwn(storedUser, "password"), false);
});
