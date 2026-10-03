import test from "node:test";
import assert from "node:assert/strict";
import { createUser } from "../services/userService.js";

test("createUser preserves server-owned id and defaults isVerified to false", async () => {
  const user = await createUser({
    email: "jane@example.com",
    fullName: "Jane Doe",
    role: "client"
  });

  assert.match(user.id, /^usr_/);
  assert.equal(user.email, "jane@example.com");
  assert.equal(user.isVerified, false);
});
