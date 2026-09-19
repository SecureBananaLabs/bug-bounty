import test from "node:test";
import assert from "node:assert/strict";
import { createUser, listUsers } from "../services/userService.js";

test("listUsers returns a defensive array copy", async () => {
  const user = await createUser({ email: "person@example.com" });
  const listedUsers = await listUsers();

  listedUsers.length = 0;

  const nextListedUsers = await listUsers();

  assert.equal(nextListedUsers.length, 1);
  assert.equal(nextListedUsers[0], user);
});
