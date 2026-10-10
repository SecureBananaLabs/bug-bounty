import test from "node:test";
import assert from "node:assert/strict";
import { createUser, listUsers } from "../services/userService.js";

test("createUser preserves a server-generated id", async () => {
  const user = await createUser({
    id: "client_supplied_id",
    email: "user@example.com"
  });

  assert.notEqual(user.id, "client_supplied_id");
  assert.match(user.id, /^usr_\d+$/);

  const storedUsers = await listUsers();
  assert.equal(storedUsers.at(-1).id, user.id);
});
