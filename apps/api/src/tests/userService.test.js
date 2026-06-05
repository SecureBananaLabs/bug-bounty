import test from "node:test";
import assert from "node:assert/strict";
import { createUser } from "../services/userService.js";

test("createUser preserves server-owned id", async () => {
  const user = await createUser({
    id: "client_supplied_user_id",
    email: "client@example.com",
    fullName: "Client Example",
    role: "CLIENT",
  });

  assert.match(user.id, /^usr_\d+$/);
  assert.notEqual(user.id, "client_supplied_user_id");
  assert.equal(user.email, "client@example.com");
  assert.equal(user.fullName, "Client Example");
  assert.equal(user.role, "CLIENT");
});
