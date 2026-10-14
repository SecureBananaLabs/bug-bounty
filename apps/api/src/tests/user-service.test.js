import test from "node:test";
import assert from "node:assert/strict";
import { createUser, listUsers } from "../services/userService.js";

test("createUser does not store submitted password fields", async () => {
  const user = await createUser({
    email: "person@example.com",
    password: "super-secret",
    name: "Person Example",
  });
  const users = await listUsers();
  const storedUser = users.find((item) => item.id === user.id);

  assert.equal(user.password, undefined);
  assert.equal(storedUser.password, undefined);
  assert.equal(user.email, "person@example.com");
  assert.equal(user.name, "Person Example");
});
