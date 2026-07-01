import test from "node:test";
import assert from "node:assert/strict";
import { registerUser } from "../services/authService.js";

test("registerUser rejects a duplicate email address", async () => {
  await registerUser({
    email: "duplicate@example.com",
    password: "password123",
    role: "client"
  });

  await assert.rejects(
    () =>
      registerUser({
        email: "duplicate@example.com",
        password: "password123",
        role: "freelancer"
      }),
    (error) => {
      assert.equal(error.status, 409);
      assert.match(error.message, /already exists/);
      return true;
    }
  );
});

test("registerUser treats email addresses case-insensitively", async () => {
  await registerUser({
    email: "case-sensitive@example.com",
    password: "password123",
    role: "client"
  });

  await assert.rejects(
    () =>
      registerUser({
        email: "CASE-SENSITIVE@example.com",
        password: "password123",
        role: "client"
      }),
    { status: 409 }
  );
});
