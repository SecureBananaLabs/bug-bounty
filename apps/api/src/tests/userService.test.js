import test from "node:test";
import assert from "node:assert/strict";
import { createUser } from "../services/userService.js";

test("createUser preserves generated ids", async () => {
  const originalNow = Date.now;
  Date.now = () => 1710000000000;

  try {
    const user = await createUser({
      id: "usr_client_controlled",
      email: "person@example.com",
      name: "Person Example",
      role: "client"
    });

    assert.equal(user.id, "usr_1710000000000");
    assert.equal(user.email, "person@example.com");
    assert.equal(user.name, "Person Example");
    assert.equal(user.role, "client");
  } finally {
    Date.now = originalNow;
  }
});
