import assert from "node:assert/strict";
import test from "node:test";

import { createUser, listUsers } from "../services/userService.js";

test("listUsers returns a snapshot that cannot mutate stored users", async () => {
  const before = await listUsers();
  const user = await createUser({
    email: "snapshot@example.com",
    fullName: "Snapshot User",
    role: "client"
  });

  const listed = await listUsers();
  listed.length = 0;
  listed.push({
    id: "usr_attacker",
    email: "attacker@example.com",
    fullName: "Attacker",
    role: "admin"
  });

  const afterMutation = await listUsers();
  assert.equal(afterMutation.length, before.length + 1);
  assert.ok(afterMutation.some((item) => item.id === user.id));
  assert.equal(afterMutation.some((item) => item.id === "usr_attacker"), false);
});
