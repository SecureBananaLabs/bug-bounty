import test from "node:test";
import assert from "node:assert/strict";
import { createUser, listUsers } from "../services/userService.js";

test("createUser assigns a server-owned createdAt ISO timestamp", async () => {
  const before = Date.now();
  const user = await createUser({ name: "alice" });
  const after = Date.now();

  assert.ok(typeof user.createdAt === "string", "createdAt should be a string");
  const parsed = Date.parse(user.createdAt);
  assert.ok(!Number.isNaN(parsed), "createdAt should parse as a valid date");
  assert.ok(parsed >= before && parsed <= after, "createdAt should fall between before/after timestamps");
  assert.equal(user.name, "alice");
});

test("createUser ignores caller-supplied createdAt values", async () => {
  const user = await createUser({ name: "bob", createdAt: "1970-01-01T00:00:00.000Z" });
  const parsed = Date.parse(user.createdAt);
  assert.ok(parsed > 0, "createdAt should reflect server time, not caller-supplied epoch zero");
  assert.notEqual(user.createdAt, "1970-01-01T00:00:00.000Z");
});

test("createUser returns the stored record via listUsers", async () => {
  const initialLength = (await listUsers()).length;
  const user = await createUser({ name: "carol" });
  const stored = await listUsers();
  assert.equal(stored.length, initialLength + 1);
  assert.ok(stored.includes(user));
});
