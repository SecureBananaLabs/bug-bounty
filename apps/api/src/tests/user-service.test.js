import test from "node:test";
import assert from "node:assert/strict";
import { createUser } from "../services/userService.js";

test("createUser keeps the generated id authoritative", async () => {
  const result = await createUser({
    id: "attacker-controlled-id",
    email: "user@example.com",
    role: "client"
  });

  assert.match(result.id, /^usr_[0-9]+$/);
  assert.notEqual(result.id, "attacker-controlled-id");
  assert.equal(result.email, "user@example.com");
  assert.equal(result.role, "client");
});
