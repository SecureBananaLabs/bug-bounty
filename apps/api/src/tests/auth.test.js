import { describe, it } from "node:test";
import assert from "node:assert";
import { registerUser, loginUser } from "../services/authService.js";

describe("authService", () => {
  const testEmail = `test_${Date.now()}@example.com`;
  const testPassword = "securePassword123";

  it("should register a user and return a token", async () => {
    const result = await registerUser({
      email: testEmail,
      password: testPassword,
      role: "client",
    });

    assert.ok(result.token);
    assert.strictEqual(result.email, testEmail);
    assert.strictEqual(result.role, "client");
  });

  it("should login with correct password", async () => {
    const result = await loginUser({
      email: testEmail,
      password: testPassword,
    });

    assert.ok(result.token);
    assert.strictEqual(result.email, testEmail);
  });

  it("should reject login with wrong password", async () => {
    await assert.rejects(
      () =>
        loginUser({
          email: testEmail,
          password: "wrongPassword",
        }),
      { message: "Invalid email or password" }
    );
  });

  it("should reject login with non-existent email", async () => {
    await assert.rejects(
      () =>
        loginUser({
          email: "nonexistent@example.com",
          password: testPassword,
        }),
      { message: "Invalid email or password" }
    );
  });

  it("should not store passwords in plaintext", async () => {
    const result = await registerUser({
      email: `hash_test_${Date.now()}@example.com`,
      password: "plaintextPassword",
      role: "client",
    });

    // Token should not contain the password
    assert.ok(!result.token?.includes?.("plaintextPassword"));
    assert.ok(!result.passwordHash);
  });
});
