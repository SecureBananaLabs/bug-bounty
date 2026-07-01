import test from "node:test";
import assert from "node:assert/strict";
import { registerUser } from "../services/authService.js";
import jwt from "jsonwebtoken";

test("registerUser returns id matching token sub claim", async () => {
  const result = await registerUser({
    email: "test@example.com",
    password: "password123",
    role: "client"
  });

  assert.ok(result.id, "should have an id");
  assert.ok(result.token, "should have a token");

  const decoded = jwt.decode(result.token);
  assert.equal(decoded.sub, result.id, "token sub should match returned id");
});

test("registerUser uses same id for both response and token", async () => {
  const result = await registerUser({
    email: "user2@example.com",
    password: "password123",
    role: "freelancer"
  });

  const decoded = jwt.decode(result.token);
  assert.equal(decoded.sub, result.id);
  assert.ok(result.id.startsWith("usr_"), "id should start with usr_");
});
