import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { registerUser, loginUser } from "../services/authService.js";
import { prisma } from "@bug-bounty/db";
import { registerSchema } from "../validation/auth.js";

jest.mock("@bug-bounty/db", () => ({
  prisma: {
    const validPayload = {
      email: "test@example.com",
      password: "password123",
      fullName: "John Doe",
    };

    prisma.user.findUnique.mockResolvedValue(null);
    expect(result).toBeDefined();
    expect(result.email).toBe(validPayload.email);
    expect(result.password).toBeUndefined();
    expect(result.fullName).toBe(validPayload.fullName);
  });

  it("should reject duplicate email registration", async () => {
    const payload = {
      email: "existing@example.com",
      password: "password123",
      fullName: "Jane Doe",
    };

    await expect(registerUser(payload)).rejects.toThrow(
    );
  });

  it("should reject registration without fullName", () => {
    const invalidPayload = {
      email: "test@example.com",
      password: "password123",
    };

    const result = registerSchema.safeParse(invalidPayload);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.includes("fullName"))).toBe(true);
    }
  });

  it("should reject registration with empty fullName", () => {
    const invalidPayload = {
      email: "test@example.com",
      password: "password123",
      fullName: "",
    };

    const result = registerSchema.safeParse(invalidPayload);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.includes("fullName"))).toBe(true);
    }
  });

  it("should login with valid credentials", async () => {
    const mockUser = {
      id: "1",