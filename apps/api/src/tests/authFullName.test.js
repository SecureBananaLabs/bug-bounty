import test from "node:test";
import assert from "node:assert/strict";
import { registerSchema } from "../validators/auth.js";
import { registerUser } from "../services/authService.js";
import { verifyAccessToken } from "../utils/jwt.js";

test("registerSchema requires a non-empty trimmed fullName", () => {
  assert.throws(
    () =>
      registerSchema.parse({
        email: "alice@example.com",
        password: "password123"
      }),
    /fullName|Required/i
  );

  assert.throws(
    () =>
      registerSchema.parse({
        email: "alice@example.com",
        password: "password123",
        fullName: "   "
      }),
    /Full name is required/i
  );

  const parsed = registerSchema.parse({
    email: "alice@example.com",
    password: "password123",
    fullName: "  Alice Lovelace  "
  });
  assert.equal(parsed.fullName, "Alice Lovelace");
  assert.equal(parsed.role, "client");
});

test("registerUser preserves validated fullName and matches userId with token sub", async () => {
  const payload = registerSchema.parse({
    email: "bob@example.com",
    password: "password123",
    fullName: "  Bob Builder  ",
    role: "freelancer"
  });

  const user = await registerUser(payload);
  assert.equal(user.email, "bob@example.com");
  assert.equal(user.fullName, "Bob Builder");
  assert.equal(user.role, "freelancer");
  assert.match(user.id, /^usr_\d+$/);

  const claims = verifyAccessToken(user.token);
  assert.equal(claims.sub, user.id);
  assert.equal(claims.role, "freelancer");
});
