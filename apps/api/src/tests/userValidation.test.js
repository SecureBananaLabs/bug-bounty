import { describe, it, expect } from "vitest";

// Test #13945: test script discovery
describe("test script discovery", () => {
  it("should discover this test file via glob pattern", () => {
    expect(true).toBe(true);
  });
});

// Test #13938: user creation validation
describe("POST /api/users validation", () => {
  it("should reject empty body", async () => {
    const { createUserSchema } = await import("../validators/user.js");
    const result = createUserSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("should accept valid user", async () => {
    const { createUserSchema } = await import("../validators/user.js");
    const result = createUserSchema.safeParse({ name: "Test User" });
    expect(result.success).toBe(true);
  });

  it("should reject empty name", async () => {
    const { createUserSchema } = await import("../validators/user.js");
    const result = createUserSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("should reject invalid email", async () => {
    const { createUserSchema } = await import("../validators/user.js");
    const result = createUserSchema.safeParse({ name: "X", email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("should reject extra fields (strict mode)", async () => {
    const { createUserSchema } = await import("../validators/user.js");
    const result = createUserSchema.safeParse({ name: "X", role: "admin" });
    expect(result.success).toBe(false);
  });
});
