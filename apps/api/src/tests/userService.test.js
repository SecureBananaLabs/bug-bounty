import test from "node:test";
import assert from "node:assert/strict";
import { createUser, listUsers } from "../services/userService.js";

test("createUser: server-generated id cannot be overridden by caller", async () => {
  const result = await createUser({
    email: "test@example.com",
    id: "malicious_user_id"
  });
  
  assert.ok(result.id.startsWith("usr_"));
  assert.notEqual(result.id, "malicious_user_id");
});

test("createUser: preserves non-id fields from payload", async () => {
  const result = await createUser({
    email: "owl@test.com",
    name: "Owl Test",
    role: "client"
  });
  
  assert.equal(result.email, "owl@test.com");
  assert.equal(result.name, "Owl Test");
  assert.equal(result.role, "client");
  assert.ok(result.id.startsWith("usr_"));
});

test("createUser: generates unique IDs for each call", async () => {
  const user1 = await createUser({ email: "a@test.com" });
  const user2 = await createUser({ email: "b@test.com" });
  
  assert.notEqual(user1.id, user2.id);
});
