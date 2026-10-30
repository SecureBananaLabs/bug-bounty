import test from "node:test";
import assert from "node:assert/strict";
import { createUser } from "../services/userService.js";

test("createUser preserves the server-generated user id", async () => {
  const user = await createUser({
    id: "usr_client_controlled",
    email: "user@example.com",
    password: "password123",
    role: "freelancer",
    fullName: "Evelyn Xu"
  });

  assert.match(user.id, /^usr_\d+$/);
  assert.equal(user.email, "user@example.com");
  assert.equal(user.role, "freelancer");
  assert.equal(user.fullName, "Evelyn Xu");
});
