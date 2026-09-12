import test from "node:test";
import assert from "node:assert/strict";
import { createUser } from "../services/userService.js";

test("createUser keeps id server-owned", async () => {
  const user = await createUser({
    id: "caller-controlled",
    email: "client@example.com",
    name: "Client Example",
    role: "client"
  });

  assert.match(user.id, /^usr_\d+$/);
  assert.notEqual(user.id, "caller-controlled");
  assert.equal(user.email, "client@example.com");
  assert.equal(user.name, "Client Example");
  assert.equal(user.role, "client");
});
