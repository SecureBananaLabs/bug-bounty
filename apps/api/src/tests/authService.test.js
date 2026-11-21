import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { registerUser } from "../services/authService.js";

test("registerUser returns an id that matches the access token subject", async () => {
  const originalNow = Date.now;
  let calls = 0;
  Date.now = () => 1000 + calls++;

  try {
    const result = await registerUser({
      email: "new-user@example.com",
      password: "password123",
      role: "freelancer"
    });
    const decoded = jwt.decode(result.token);

    assert.equal(result.id, "usr_1000");
    assert.equal(decoded.sub, result.id);
    assert.equal(decoded.role, result.role);
  } finally {
    Date.now = originalNow;
  }
});
