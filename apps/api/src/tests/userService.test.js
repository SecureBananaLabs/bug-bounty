import test from "node:test";
import assert from "node:assert/strict";
import { createUser, listUsers } from "../services/userService.js";

test("createUser stores non-sensitive fields", async () => {
  // Reset state by not relying on prior data
  const user = await createUser({
    email: "alice@example.com",
    name: "Alice",
    role: "client",
  });

  assert.equal(user.email, "alice@example.com");
  assert.equal(user.name, "Alice");
  assert.equal(user.role, "client");
  assert.ok(user.id.startsWith("usr_"));
});

test("createUser does not store password", async () => {
  const user = await createUser({
    email: "bob@example.com",
    password: "super-secret-123",
    role: "freelancer",
  });

  // The returned user must not contain the password
  assert.equal(user.password, undefined);
});

test("listUsers does not expose passwords", async () => {
  // Clear the array by resetting module state
  // Create two users, one with password
  await createUser({ email: "carol@example.com", role: "client" });
  await createUser({
    email: "dave@example.com",
    password: "daves-password",
    role: "freelancer",
  });

  const allUsers = await listUsers();
  for (const u of allUsers) {
    assert.equal(u.password, undefined, `User ${u.id} exposed password`);
  }
});
