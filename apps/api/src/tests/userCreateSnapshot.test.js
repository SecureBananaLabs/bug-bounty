import test from "node:test";
import assert from "node:assert/strict";
import { createUser, listUsers } from "../services/userService.js";

test("createUser returns a defensive snapshot", async () => {
  const created = await createUser({
    email: "returned-user@example.com",
    name: "Returned User",
    role: "client"
  });

  created.email = "mutated@example.com";
  created.name = "Mutated User";

  const users = await listUsers();

  assert.equal(users.some((user) => user.email === "mutated@example.com"), false);
  assert.equal(users.some((user) => user.name === "Mutated User"), false);
  assert.equal(users.some((user) => user.email === "returned-user@example.com"), true);
});
