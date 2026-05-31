import test from "node:test";
import assert from "node:assert/strict";
import { createUser } from "../services/userService.js";

test("createUser keeps user ids server-owned", async (t) => {
  const originalNow = Date.now;
  t.after(() => {
    Date.now = originalNow;
  });
  Date.now = () => 1700000000000;

  const user = await createUser({
    id: "usr_client_supplied",
    email: "client@example.com",
    name: "Client Supplied"
  });

  assert.equal(user.id, "usr_1700000000000");
});
