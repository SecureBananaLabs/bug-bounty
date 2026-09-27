import test from "node:test";
import assert from "node:assert/strict";
import { createUser } from "../services/userService.js";

test("createUser preserves the server-owned id", async () => {
  const user = await createUser({
    id: "client_supplied_id",
    email: "new.user@example.com",
    name: "New User",
    role: "freelancer"
  });

  assert.match(user.id, /^usr_\d+$/);
  assert.notEqual(user.id, "client_supplied_id");
  assert.equal(user.email, "new.user@example.com");
  assert.equal(user.name, "New User");
  assert.equal(user.role, "freelancer");
});
