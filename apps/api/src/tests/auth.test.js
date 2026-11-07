import { describe, it } from "node:test";
import assert from "node:assert";
import { registerSchema } from "../validators/auth.js";

describe("auth validators", () => {
  it("should fail validation if role is admin", () => {
    const result = registerSchema.safeParse({
      email: "test@example.com",
      password: "password123",
      role: "admin"
    });
    assert.strictEqual(result.success, false);
  });

  it("should pass validation if role is client or freelancer", () => {
    const r1 = registerSchema.safeParse({
      email: "client@example.com",
      password: "password123",
      role: "client"
    });
    assert.strictEqual(r1.success, true);
    assert.strictEqual(r1.data.role, "client");

    const r2 = registerSchema.safeParse({
      email: "freelancer@example.com",
      password: "password123",
      role: "freelancer"
    });
    assert.strictEqual(r2.success, true);
    assert.strictEqual(r2.data.role, "freelancer");
  });

  it("should default role to client if omitted", () => {
    const result = registerSchema.safeParse({
      email: "default@example.com",
      password: "password123"
    });
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.data.role, "client");
  });
});
