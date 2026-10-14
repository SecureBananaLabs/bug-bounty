import test from "node:test";
import assert from "node:assert/strict";
import { createUser } from "../services/userService.js";

test("createUser preserves the server-generated user id", async () => {
  const originalNow = Date.now;
  Date.now = () => 1710000000000;

  try {
    const user = await createUser({
      id: "client-controlled-id",
      email: "client@example.com",
      role: "client"
    });

    assert.equal(user.id, "usr_1710000000000");
    assert.equal(user.email, "client@example.com");
    assert.equal(user.role, "client");
  } finally {
    Date.now = originalNow;
  }
});
