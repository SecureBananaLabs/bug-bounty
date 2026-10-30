import test from "node:test";
import assert from "node:assert/strict";
import { loginUser } from "../services/authService.js";

test("loginUser returns id and role fields", async () => {
  const result = await loginUser({ email: "user@example.com", password: "password123" });
  assert.ok(typeof result.id === "string" && result.id.length > 0, "id must be a non-empty string");
  assert.ok(typeof result.role === "string" && result.role.length > 0, "role must be a non-empty string");
  assert.equal(result.email, "user@example.com");
  assert.ok(typeof result.token === "string", "token must be a string");
});
