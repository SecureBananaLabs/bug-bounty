import test from "node:test";
import assert from "node:assert/strict";
import { createUser } from "../services/userService.js";

test("User creation ID preservation", async (t) => {
  await t.test("ignores client-supplied id", async () => {
    const user = await createUser({
      id: "custom_id_123",
      email: "test@example.com",
      fullName: "Test User"
    });
    assert.match(user.id, /^usr_\d+$/);
    assert.notEqual(user.id, "custom_id_123");
  });

  await t.test("preserves other payload fields", async () => {
    const user = await createUser({
      id: "custom_id_123",
      email: "hello@example.com",
      fullName: "Hello World"
    });
    assert.equal(user.email, "hello@example.com");
    assert.equal(user.fullName, "Hello World");
  });
});
