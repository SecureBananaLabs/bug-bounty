import test from "node:test";
import assert from "node:assert/strict";
import { createUser, listUsers } from "../services/userService.js";

test("createUser keeps ids server-owned", async () => {
  const user = await createUser({
    id: "usr_attacker",
    email: "server-owned-id@example.com",
    fullName: "Server Owned"
  });
  const storedUser = (await listUsers()).find((candidate) => candidate.email === user.email);

  assert.match(user.id, /^usr_\d+$/);
  assert.notEqual(user.id, "usr_attacker");
  assert.equal(user.email, "server-owned-id@example.com");
  assert.equal(user.fullName, "Server Owned");
  assert.equal(storedUser?.id, user.id);
});
