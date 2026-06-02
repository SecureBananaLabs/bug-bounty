import test from "node:test";
import assert from "node:assert/strict";
import { loginUser } from "../services/authService.js";
import { createUser } from "../services/userService.js";
import jwt from "jsonwebtoken";

test("loginUser issues token with payload role or defaults to client", async () => {
  // Test with explicit admin role
  const adminLogin = await loginUser({ email: "admin@example.com", role: "admin" });
  assert.equal(adminLogin.email, "admin@example.com");
  
  const adminDecoded = jwt.decode(adminLogin.token);
  assert.equal(adminDecoded.role, "admin");

  // Test with explicit freelancer role
  const freelancerLogin = await loginUser({ email: "free@example.com", role: "freelancer" });
  const freelancerDecoded = jwt.decode(freelancerLogin.token);
  assert.equal(freelancerDecoded.role, "freelancer");

  // Test default to client role
  const defaultLogin = await loginUser({ email: "client@example.com" });
  const defaultDecoded = jwt.decode(defaultLogin.token);
  assert.equal(defaultDecoded.role, "client");
});

test("loginUser retrieves actual role from existing user in storage", async () => {
  // Create an existing user with 'freelancer' role
  const user = await createUser({
    email: "registered-free@example.com",
    role: "freelancer"
  });

  // Login without role parameter in payload (should retrieve 'freelancer' from userService)
  const loginResult = await loginUser({ email: "registered-free@example.com" });
  assert.equal(loginResult.email, "registered-free@example.com");

  const decoded = jwt.decode(loginResult.token);
  assert.equal(decoded.sub, user.id);
  assert.equal(decoded.role, "freelancer");
});
