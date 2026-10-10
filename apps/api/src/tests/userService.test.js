import test from "node:test";
import assert from "node:assert/strict";
import { createUser, listUsers } from "../services/userService.js";

test("createUser ignores a caller-supplied id", async () => {
  const created = await createUser({ id: "usr_attacker", email: "ada@example.com" });

  assert.notEqual(created.id, "usr_attacker");
  assert.match(created.id, /^usr_\d+$/);
  assert.equal(created.email, "ada@example.com");
});

test("createUser keeps ordinary payload fields", async () => {
  const created = await createUser({ email: "lin@example.com", role: "freelancer" });

  assert.equal(created.email, "lin@example.com");
  assert.equal(created.role, "freelancer");
});

test("the created user is appended to the listing with the generated id", async () => {
  const before = (await listUsers()).length;
  const created = await createUser({ email: "sam@example.com" });
  const listed = await listUsers();

  assert.equal(listed.length, before + 1);
  assert.equal(listed.at(-1).id, created.id);
});
