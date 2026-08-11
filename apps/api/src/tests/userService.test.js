import test from "node:test";
import assert from "node:assert/strict";
import { createUser, listUsers } from "../services/userService.js";

test("user service keeps ids, timestamps, and stored records server-owned", async () => {
  const user = await createUser({
    id: "client-user-id",
    createdAt: "2000-01-01T00:00:00.000Z",
    email: "user@example.com",
    role: "client"
  });

  assert.notEqual(user.id, "client-user-id");
  assert.notEqual(user.createdAt, "2000-01-01T00:00:00.000Z");
  assert.equal(user.email, "user@example.com");

  user.email = "mutated-response@example.com";
  const firstList = await listUsers();
  assert.equal(firstList.at(-1).email, "user@example.com");

  firstList.at(-1).email = "mutated-list@example.com";
  const secondList = await listUsers();
  assert.equal(secondList.at(-1).email, "user@example.com");
});
