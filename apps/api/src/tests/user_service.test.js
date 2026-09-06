import test from "node:test";
import assert from "node:assert/strict";
import { createUser, listUsers } from "../services/userService.js";

test("userService.createUser preserves server-generated ID and prevents client override", async () => {
  // 1. Standard creation without ID
  const user1 = await createUser({
    name: "Alice Engineer",
    email: "alice@example.com",
    role: "freelancer"
  });

  assert.ok(user1.id.startsWith("usr_"));
  assert.equal(user1.email, "alice@example.com");
  assert.equal(user1.role, "freelancer");

  // 2. Creation with malicious/custom ID override attempt
  const user2 = await createUser({
    id: "injected_attacker_id_9999",
    name: "Bob Client",
    email: "bob@example.com",
    role: "client"
  });

  assert.notEqual(user2.id, "injected_attacker_id_9999");
  assert.ok(user2.id.startsWith("usr_"));
  assert.equal(user2.name, "Bob Client");
  assert.equal(user2.email, "bob@example.com");

  // 3. Confirm listed users in repository contain server-assigned IDs
  const allUsers = await listUsers();
  const foundUser2 = allUsers.find((u) => u.email === "bob@example.com");
  assert.ok(foundUser2);
  assert.equal(foundUser2.id, user2.id);
  assert.notEqual(foundUser2.id, "injected_attacker_id_9999");
});
