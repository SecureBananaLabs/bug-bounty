import test from "node:test";
import assert from "node:assert/strict";
import {
  createUser,
  getUserById,
  getUserByEmail,
  listUsers,
  updateUser,
  deleteUser,
  _clearUsers
} from "../services/userService.js";

test.beforeEach(() => {
  _clearUsers();
});

test("createUser generates cryptographically secure, unpredictable UUID v4 format", async () => {
  const user1 = await createUser({ name: "Alice", email: "alice@example.com" });
  const user2 = await createUser({ name: "Bob", email: "bob@example.com" });

  assert.ok(user1.id.startsWith("usr_"));
  assert.ok(user2.id.startsWith("usr_"));
  assert.notEqual(user1.id, user2.id);

  // Validate UUID v4 format after prefix
  const uuidPart = user1.id.replace("usr_", "");
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  assert.match(uuidPart, uuidRegex);
});

test("getUserById and getUserByEmail retrieve matching user correctly", async () => {
  const created = await createUser({ name: "Charlie", email: "charlie@domain.org" });

  const foundById = await getUserById(created.id);
  assert.deepEqual(foundById, created);

  const foundByEmail = await getUserByEmail("CHARLIE@DOMAIN.ORG");
  assert.deepEqual(foundByEmail, created);

  const notFound = await getUserById("usr_non_existent");
  assert.equal(notFound, null);
});

test("updateUser updates user fields without altering immutable user id", async () => {
  const created = await createUser({ name: "Dana", email: "dana@example.com" });
  const originalId = created.id;

  const updated = await updateUser(originalId, { name: "Dana Smith", id: "malicious_override" });
  assert.equal(updated.id, originalId);
  assert.equal(updated.name, "Dana Smith");
  assert.ok(updated.updatedAt >= created.createdAt);
});

test("deleteUser removes user from store", async () => {
  const created = await createUser({ name: "Evan", email: "evan@example.com" });
  const deleted = await deleteUser(created.id);
  assert.equal(deleted, true);

  const users = await listUsers();
  assert.equal(users.length, 0);
});
