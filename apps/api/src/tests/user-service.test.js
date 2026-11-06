import test from "node:test";
import assert from "node:assert/strict";
import { createUser } from "../services/userService.js";

test("createUser preserves the server-generated id", async () => {
  const result = await createUser({
    email: "user@example.com",
    password: "password123",
    role: "client",
    fullName: "Example User",
    id: "usr_attacker_supplied"
  });

  assert.equal(result.email, "user@example.com");
  assert.equal(result.role, "client");
  assert.equal(result.fullName, "Example User");
  assert.match(result.id, /^usr_\d+$/);
  assert.notEqual(result.id, "usr_attacker_supplied");
});
