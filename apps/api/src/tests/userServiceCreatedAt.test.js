import test from "node:test";
import assert from "node:assert/strict";
import { createUser, listUsers } from "../services/userService.js";

test("createUser includes a server-owned createdAt timestamp", async () => {
  const user = await createUser({
    email: "client@example.com",
    role: "client",
    createdAt: "1999-01-01T00:00:00.000Z"
  });
  const users = await listUsers();
  const storedUser = users.find((candidate) => candidate.id === user.id);

  assert.match(user.id, /^usr_/);
  assert.equal(user.email, "client@example.com");
  assert.equal(user.role, "client");
  assert.notEqual(user.createdAt, "1999-01-01T00:00:00.000Z");
  assert.doesNotThrow(() => new Date(user.createdAt).toISOString());
  assert.equal(storedUser.createdAt, user.createdAt);
});
