import test from "node:test";
import assert from "node:assert/strict";
import { createUser } from "../services/userService.js";

test("createUser ignores client-controlled id override", async () => {
  const user = await createUser({
    id: "client-controlled",
    email: "person@example.com",
    role: "client"
  });

  assert.notEqual(user.id, "client-controlled");
  assert.match(user.id, /^usr_/);
  assert.equal(user.email, "person@example.com");
  assert.equal(user.role, "client");
});
