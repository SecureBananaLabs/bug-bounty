import test from "node:test";
import assert from "node:assert/strict";
import { createUser, listUsers } from "../services/userService.js";

test("createUser keeps ids server-owned", async () => {
  const originalNow = Date.now;
  Date.now = () => 123456;

  try {
    const user = await createUser({
      id: "usr_attacker_supplied",
      name: "Ada Lovelace",
      email: "ada@example.com",
      role: "client"
    });

    assert.equal(user.id, "usr_123456");
    assert.equal(user.name, "Ada Lovelace");
    assert.notEqual(user.id, "usr_attacker_supplied");

    const storedUser = (await listUsers()).at(-1);
    assert.equal(storedUser.id, "usr_123456");
  } finally {
    Date.now = originalNow;
  }
});
