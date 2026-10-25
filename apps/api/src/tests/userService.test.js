import test from "node:test";
import assert from "node:assert/strict";
import { createUser, listUsers } from "../services/userService.js";

test("createUser generates unique server-controlled user IDs", async () => {
  const u1 = await createUser({ id: "override_attempt_1", name: "Alice", email: "alice@example.com" });
  assert.notEqual(u1.id, "override_attempt_1");
  assert.ok(u1.id.startsWith("usr_"));
  assert.equal(u1.name, "Alice");
  assert.equal(u1.email, "alice@example.com");

  const u2 = await createUser({ name: "Bob", email: "bob@example.com" });
  assert.notEqual(u1.id, u2.id);
  assert.ok(u2.id.startsWith("usr_"));
});

test("createUser creates distinct IDs even under simultaneous creation", async () => {
  const creations = await Promise.all(
    Array.from({ length: 20 }, (_, i) => createUser({ name: `User ${i}`, index: i }))
  );
  const ids = creations.map((u) => u.id);
  const uniqueIds = new Set(ids);
  assert.equal(uniqueIds.size, ids.length);
});
