import { describe, it, expect, beforeEach, vi } from "vitest";
import { registerUser } from "../services/authService.js";
import { registerSchema } from "../validation/authSchemas.js";

vi.mock("@bug-bounty/db", () => ({
  prisma: {
  });

  it("registers a new user and returns payload with fullName", async () => {
    const payload = { email: "a@b.com", password: "secret123", fullName: "Alice" };
    const result = await registerUser(payload);
    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("email", "a@b.com");
    expect(result).toHaveProperty("role", "CLIENT");
  });

  it("rejects missing fullName in registration schema", () => {
    const payload = { email: "a@b.com", password: "secret123" };
    const result = registerSchema.safeParse(payload);
    expect(result.success).toBe(false);
    expect(result.error.issues.some(i => i.path[0] === "fullName")).toBe(true);
  });

  it("accepts valid registration payload with fullName", () => {
    const payload = { email: "a@b.com", password: "secret123", fullName: "Alice" };
    const result = registerSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

});