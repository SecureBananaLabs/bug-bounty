import test from "node:test";
import assert from "node:assert/strict";
import { createUser } from "../services/userService.js";

test("createUser keeps generated ids server-owned and preserves allowed payload fields", async () => {
  const user = await createUser({
    id: "usr_client_supplied",
    email: "alice@example.com",
    role: "client",
    fullName: "Alice Example"
  });

  assert.notEqual(user.id, "usr_client_supplied");
  assert.match(user.id, /^usr_\d+$/);
  assert.equal(user.email, "alice@example.com");
  assert.equal(user.role, "client");
  assert.equal(user.fullName, "Alice Example");
});

test("createUser stores the generated id, not the caller-supplied id", async () => {
  const user = await createUser({
    id: "usr_spoofed_storage_key",
    email: "bob@example.com",
    role: "freelancer"
  });

  assert.notEqual(user.id, "usr_spoofed_storage_key");
  assert.match(user.id, /^usr_\d+$/);
});
