import test from "node:test";
import assert from "node:assert/strict";
import { createUser } from "../services/userService.js";

test("createUser keeps ids server-owned", async () => {
  const user = await createUser({ id: "usr_client", email: "a@example.com", name: "Ada" });

  assert.match(user.id, /^usr_/);
  assert.notEqual(user.id, "usr_client");
  assert.equal(user.email, "a@example.com");
});
