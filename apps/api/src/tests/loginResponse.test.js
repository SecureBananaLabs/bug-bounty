import test from "node:test";
import assert from "node:assert/strict";
import { loginUser } from "../services/authService.js";

test("loginUser service output shape", async (t) => {
  process.env.JWT_SECRET = "testsecret";
  const result = await loginUser({ email: "test@example.com" });
  assert.equal(result.email, "test@example.com");
  assert.ok(result.token);
  assert.equal(result.id, "usr_existing");
  assert.equal(result.role, "client");
});
