import test from "node:test";
import assert from "node:assert/strict";
import { createUser } from "../services/userService.js";

test("createUser keeps server-owned ids authoritative", async () => {
  const user = await createUser({
    id: "client-controlled-id",
    email: "person@example.com",
    role: "client",
  });

  assert.match(user.id, /^usr_\d+$/);
  assert.notEqual(user.id, "client-controlled-id");
  assert.equal(user.email, "person@example.com");
  assert.equal(user.role, "client");
});
