import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { registerUser } from "../services/authService.js";

test("registerUser returns id matching token subject", async () => {
  const result = await registerUser({
    email: "test@example.com",
    password: "password123",
    role: "client",
  });

  const decoded = jwt.decode(result.token);
  assert.equal(decoded.sub, result.id, "JWT sub must match returned user id");
});

test("registerUser uses consistent id even under time pressure", async () => {
  // Simulate many rapid registrations to expose any race between Date.now() calls
  const results = await Promise.all(
    Array.from({ length: 50 }, () =>
      registerUser({
        email: "race@example.com",
        password: "password123",
        role: "freelancer",
      })
    )
  );

  for (const result of results) {
    const decoded = jwt.decode(result.token);
    assert.equal(
      decoded.sub,
      result.id,
      `JWT sub ${decoded.sub} does not match id ${result.id}`
    );
  }
});
