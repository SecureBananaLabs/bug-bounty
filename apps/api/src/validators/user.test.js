import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validateCreateUser } from "./user.js";

describe("User Creation Validation & Role Enforcement (#743)", () => {
  it("rejects user creation with admin role", () => {
    const res = validateCreateUser({
      email: "admin@test.com",
      fullName: "Admin User",
      role: "admin"
    });
    assert.equal(res.ok, false);
    assert.equal(res.error, "Admin role cannot be self-assigned");
  });

  it("rejects short fullName (< 2 chars)", () => {
    const res = validateCreateUser({
      email: "user@test.com",
      fullName: "A"
    });
    assert.equal(res.ok, false);
    assert.equal(res.error, "Full name must be at least 2 characters");
  });

  it("rejects malformed email formats", () => {
    const invalidEmails = ["notanemail", "user@", "@domain.com", "user@domain", "user@.com"];
    for (const email of invalidEmails) {
      const res = validateCreateUser({
        email,
        fullName: "Test User"
      });
      assert.equal(res.ok, false, `Expected ${email} to be rejected`);
      assert.equal(res.error, "Valid email is required");
    }
  });

  it("accepts valid client user payload", () => {
    const res = validateCreateUser({
      email: "client@test.com",
      fullName: "Alice Client",
      role: "client",
      bio: "Startup founder"
    });
    assert.equal(res.ok, true);
    assert.equal(res.data.email, "client@test.com");
    assert.equal(res.data.fullName, "Alice Client");
  });
});

