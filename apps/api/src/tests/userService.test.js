import test from "node:test";
import assert from "node:assert/strict";
import { createUser, listUsers } from "../services/userService.js";

test("createUser stores a server-owned createdAt timestamp", async () => {
  const user = await createUser({
    id: "client_supplied_id",
    name: "Test User",
    createdAt: "client_supplied_timestamp",
  });

  assert.match(user.id, /^usr_/);
  assert.notEqual(user.id, "client_supplied_id");
  assert.notEqual(user.createdAt, "client_supplied_timestamp");
  assert.equal(new Date(user.createdAt).toISOString(), user.createdAt);

  const users = await listUsers();
  assert.equal(users.at(-1), user);
});
