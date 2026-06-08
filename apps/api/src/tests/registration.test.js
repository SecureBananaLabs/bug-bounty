import test from "node:test";
import assert from "node:assert/strict";
import { registerUser } from "../services/authService.js";

test("registerUser returns id that matches token subject", async () => {
  const result = await registerUser({
    email: "test@example.com",
    password: "password123",
    role: "client"
  });
  
  // Decode the token to get the subject
  const tokenParts = result.token.split(".");
  const payload = JSON.parse(Buffer.from(tokenParts[1], "base64").toString());
  
  // The returned id should match the token subject
  assert.equal(result.id, payload.sub, "Token subject must match returned user id");
  assert.equal(payload.role, "client");
  assert.ok(result.id.startsWith("usr_"));
});

test("registerUser with freelancer role preserves subject match", async () => {
  const result = await registerUser({
    email: "freelancer@example.com",
    password: "password123",
    role: "freelancer"
  });
  
  const tokenParts = result.token.split(".");
  const payload = JSON.parse(Buffer.from(tokenParts[1], "base64").toString());
  
  assert.equal(result.id, payload.sub);
  assert.equal(payload.role, "freelancer");
});

