import test from "node:test";
import assert from "node:assert/strict";
import { createUser } from "../services/userService.js";

test("createUser keeps generated ids server-owned", async () => {
  const user = await createUser({ id: "usr_client_supplied", email: "alice@example.com", role: "client" });

  assert.notEqual(user.id, "usr_client_supplied");
  assert.match(user.id, /^usr_\d+$/);
  assert.equal(user.email, "alice@example.com");
  assert.equal(user.role, "client");
});
