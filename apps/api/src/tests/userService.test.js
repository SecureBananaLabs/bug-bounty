import test from "node:test";
import assert from "node:assert/strict";
import { createUser, listUsers } from "../services/userService.js";

test("createUser adds a server-owned createdAt timestamp", async () => {
  const beforeCreate = Date.now();
  const user = await createUser({
    email: "created-at-user@example.com",
    fullName: "Created At User",
    role: "client",
    createdAt: "2000-01-01T00:00:00.000Z"
  });
  const afterCreate = Date.now();

  assert.equal(typeof user.createdAt, "string");

  const createdAtTime = Date.parse(user.createdAt);
  assert.ok(Number.isFinite(createdAtTime));
  assert.ok(createdAtTime >= beforeCreate);
  assert.ok(createdAtTime <= afterCreate);
  assert.notEqual(user.createdAt, "2000-01-01T00:00:00.000Z");

  const users = await listUsers();
  assert.equal(users.at(-1).createdAt, user.createdAt);
});
