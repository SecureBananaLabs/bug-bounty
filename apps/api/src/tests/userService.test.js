import test from "node:test";
import assert from "node:assert/strict";
import { createUser } from "../services/userService.js";

test("createUser omits password field", async () => {
  const user = await createUser({
    name: "John Doe",
    email: "john@example.com",
    password: "secretpassword123"
  });
  
  assert.ok(user.id.startsWith("usr_"));
  assert.equal(user.name, "John Doe");
  assert.equal(user.email, "john@example.com");
  assert.equal(user.password, undefined);
  assert.ok(!("password" in user));
});
