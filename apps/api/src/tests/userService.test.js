import test from "node:test";
import assert from "node:assert/strict";
import {
  DuplicateUserEmailError,
  createUser,
  listUsers
} from "../services/userService.js";

function userPayload(overrides = {}) {
  const suffix = `${Date.now()}-${Math.random()}`;

  return {
    email: `user-${suffix}@example.com`,
    fullName: "Alex User",
    role: "client",
    ...overrides
  };
}

test("createUser rejects a duplicate email address", async () => {
  const payload = userPayload();

  const created = await createUser(payload);
  assert.equal(created.email, payload.email);

  await assert.rejects(
    () => createUser({ ...payload, fullName: "Alex Duplicate" }),
    DuplicateUserEmailError
  );

  const matchingUsers = (await listUsers()).filter(
    (user) => user.email === payload.email
  );

  assert.equal(matchingUsers.length, 1);
  assert.equal(matchingUsers[0].fullName, "Alex User");
});

test("createUser allows different email addresses", async () => {
  const first = await createUser(userPayload());
  const second = await createUser(userPayload());

  assert.notEqual(first.email, second.email);
});
