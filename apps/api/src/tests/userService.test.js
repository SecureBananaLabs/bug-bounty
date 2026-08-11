import test from "node:test";
import assert from "node:assert/strict";
import { createUser, listUsers } from "../services/userService.js";

test("createUser keeps user ids server-generated", async () => {
  const email = `server-owned-id-${Date.now()}@example.com`;
  const user = await createUser({
    id: "client_supplied_user_id",
    email,
    role: "freelancer"
  });

  assert.match(user.id, /^usr_/);
  assert.notEqual(user.id, "client_supplied_user_id");
  assert.equal(user.email, email);
  assert.equal(user.role, "freelancer");

  const storedUsers = await listUsers();
  const storedUser = storedUsers.find((stored) => stored.email === email);

  assert.ok(storedUser);
  assert.equal(storedUser.id, user.id);
});
