import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validateLogin } from "./auth.js";

describe("Login Password Hardening (#11689)", () => {
  it("rejects login with empty password", () => {
    const res = validateLogin({
      email: "user@test.com",
      password: ""
    });
    assert.equal(res.ok, false);
    assert.equal(res.error, "Invalid email or password");
  });

  it("rejects login with short password (< 8 chars)", () => {
    const res = validateLogin({
      email: "user@test.com",
      password: "123"
    });
    assert.equal(res.ok, false);
    assert.equal(res.error, "Invalid email or password");
  });

  it("rejects login with missing password", () => {
    const res = validateLogin({
      email: "user@test.com"
    });
    assert.equal(res.ok, false);
    assert.equal(res.error, "Invalid email or password");
  });

  it("accepts login with valid email and password", () => {
    const res = validateLogin({
      email: "user@test.com",
      password: "ValidPassword123"
    });
    assert.equal(res.ok, true);
    assert.equal(res.data.email, "user@test.com");
  });
});
