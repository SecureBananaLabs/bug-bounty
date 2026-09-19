import test from "node:test";
import assert from "node:assert/strict";
import { loginUser } from "../services/authService.js";

test("loginUser returns id and role with the login response", async () => {
  const result = await loginUser({
    email: "client@example.com",
    password: "password123"
  });

  assert.equal(result.id, "usr_existing");
  assert.equal(result.email, "client@example.com");
  assert.equal(result.role, "client");
  assert.equal(typeof result.token, "string");
  assert.ok(result.token.length > 0);
});
