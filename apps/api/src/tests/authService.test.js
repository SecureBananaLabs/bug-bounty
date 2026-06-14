import test from "node:test";
import assert from "node:assert/strict";
import { loginUser } from "../services/authService.js";
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
