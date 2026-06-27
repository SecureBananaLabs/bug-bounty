import test from "node:test";
import assert from "node:assert/strict";
import { createUser, listUsers } from "../services/userService.js";

test("listUsers omits stored password values", async () => {
  const email = `redacted-${Date.now()}@example.com`;

  await createUser({
    email,
    name: "Redacted User",
    password: "s3cret"
  });

  const users = await listUsers();
  const listed = users.find((user) => user.email === email);

  assert.ok(listed);
  assert.equal(listed.name, "Redacted User");
  assert.equal(Object.hasOwn(listed, "password"), false);
});
