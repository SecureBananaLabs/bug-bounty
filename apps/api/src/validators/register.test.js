import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validateRegister } from "./auth.js";

describe("Registration Role Security (#11687)", () => {
  it("rejects admin role self-assignment during registration", () => {
    const res = validateRegister({
      email: "attacker@test.com",
      password: "SuperSecretPassword123",
      role: "admin"
    });
    assert.equal(res.ok, false);
    assert.equal(res.error, "Admin role cannot be self-assigned during registration");
  });

  it("accepts client registration", () => {
    const res = validateRegister({
      email: "client@test.com",
      password: "SuperSecretPassword123",
      role: "client"
    });
    assert.equal(res.ok, true);
    assert.equal(res.data.role, "client");
  });

  it("accepts freelancer registration", () => {
    const res = validateRegister({
      email: "dev@test.com",
      password: "SuperSecretPassword123",
      role: "freelancer"
    });
    assert.equal(res.ok, true);
    assert.equal(res.data.role, "freelancer");
  });

  it("defaults role to client when omitted", () => {
    const res = validateRegister({
      email: "user@test.com",
      password: "SuperSecretPassword123"
    });
    assert.equal(res.ok, true);
    assert.equal(res.data.role, "client");
  });
});
