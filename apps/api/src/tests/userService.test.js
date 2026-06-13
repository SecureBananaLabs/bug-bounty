import { randomUUID } from "node:crypto";
import { beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { createUser, listUsers, resetUsersForTest } from "../services/userService.js";

beforeEach(() => {
  resetUsersForTest();
});

test("createUser ignores a client-provided id and stores the generated user id", async () => {
  const email = `payload-${randomUUID()}@example.com`;

  const user = await createUser({
    id: "usr_client_supplied",
    name: "Payload Name",
    email,
  });

  assert.match(user.id, /^usr_[0-9a-f-]+$/);
  assert.notStrictEqual(user.id, "usr_client_supplied");
  assert.strictEqual(user.name, "Payload Name");
  assert.strictEqual(user.email, email);

  const stored = (await listUsers()).find((entry) => entry.email === email);
  assert.strictEqual(stored?.id, user.id);
});