import test from "node:test";
import assert from "node:assert/strict";
import { createUser, listUsers } from "../services/userService.js";

test("createUser preserves generated ids", async () => {
  const beforeCount = (await listUsers()).length;
  const originalNow = Date.now;
  Date.now = () => 1710000000000;

  try {
    const user = await createUser({
      id: "usr_client_controlled",
      email: "person@example.com",
      name: "Person Example",
      role: "client"
    });

    assert.match(user.id, /^usr_1710000000000_[0-9a-f-]{36}$/);
    assert.notEqual(user.id, "usr_client_controlled");
    assert.equal(user.email, "person@example.com");
    assert.equal(user.name, "Person Example");
    assert.equal(user.role, "client");

    const users = await listUsers();
    assert.equal(users.length, beforeCount + 1);
    assert.equal(users[users.length - 1], user);
  } finally {
    Date.now = originalNow;
  }
});

test("createUser generates unique ids for same-millisecond users", async () => {
  const originalNow = Date.now;
  Date.now = () => 1710000000000;

  try {
    const created = await Promise.all(
      Array.from({ length: 20 }, (_, index) => createUser({ email: `person${index}@example.com` }))
    );
    const ids = created.map((user) => user.id);

    assert.equal(new Set(ids).size, ids.length);
    for (const id of ids) {
      assert.match(id, /^usr_1710000000000_[0-9a-f-]{36}$/);
    }
  } finally {
    Date.now = originalNow;
  }
});
