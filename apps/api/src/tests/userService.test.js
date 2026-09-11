import assert from "node:assert/strict";
import test from "node:test";

import { createUser } from "../services/userService.js";

test("createUser keeps id server-owned", async () => {
  const user = await createUser({ id: "attacker-controlled", name: "Test" });

  assert.notEqual(user.id, "attacker-controlled");
  assert.match(user.id, /^usr_\d+_[0-9a-f-]{36}$/i);
  assert.equal(user.name, "Test");
});

test("createUser generates unique IDs for same-millisecond users", async (t) => {
  const originalNow = Date.now;
  Date.now = () => 1234567890;
  t.after(() => {
    Date.now = originalNow;
  });

  const first = await createUser({ name: "First" });
  const second = await createUser({ name: "Second" });

  assert.notEqual(first.id, second.id);
  assert.match(first.id, /^usr_1234567890_[0-9a-f-]{36}$/i);
  assert.match(second.id, /^usr_1234567890_[0-9a-f-]{36}$/i);
});
