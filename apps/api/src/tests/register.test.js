import test from "node:test";
import assert from "node:assert/strict";
import { registerUser } from "../services/authService.js";

test("registerUser strips admin role", async () => {
  const result = await registerUser({
    email: "admin@test.com",
    password: "password123",
    role: "admin"
  });
  assert.equal(result.role, "client");
});

test("registerUser preserves freelancer role", async () => {
  const result = await registerUser({
    email: "freelancer@test.com",
    password: "password123",
    role: "freelancer"
  });
  assert.equal(result.role, "freelancer");
});

test("registerUser token subject matches returned id", async () => {
  const result = await registerUser({
    email: "user@test.com",
    password: "password123",
    role: "client"
  });
  // Decode the token to verify subject matches
  const payload = JSON.parse(
    Buffer.from(result.token.split(".")[1], "base64url").toString()
  );
  assert.equal(payload.sub, result.id);
  assert.equal(payload.role, result.role);
});
