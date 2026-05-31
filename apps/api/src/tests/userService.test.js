import test from "node:test";
import assert from "node:assert/strict";
import { createUser, listUsers } from "../services/userService.js";

test("user service keeps records and ids server-owned", async () => {
  const initialUsers = await listUsers();
  const initialCount = initialUsers.length;

  const created = await createUser({
    id: "usr_client_controlled",
    email: "server-owned-user@example.com",
    fullName: "Server Owned User",
    role: "client"
  });

  assert.match(created.id, /^usr_\d+$/);
  assert.notEqual(created.id, "usr_client_controlled");

  created.fullName = "mutated through returned create payload";

  const listedUsers = await listUsers();
  assert.equal(listedUsers.length, initialCount + 1);
  assert.equal(listedUsers.at(-1).fullName, "Server Owned User");

  listedUsers.push({
    id: "usr_client_injected",
    email: "injected@example.com",
    fullName: "Injected User",
    role: "admin"
  });
  listedUsers.at(-2).fullName = "mutated through list result";

  const reloadedUsers = await listUsers();
  assert.equal(reloadedUsers.length, initialCount + 1);
  assert.equal(reloadedUsers.at(-1).id, created.id);
  assert.equal(reloadedUsers.at(-1).fullName, "Server Owned User");
  assert.equal(
    reloadedUsers.some((user) => user.id === "usr_client_injected"),
    false
  );
});
