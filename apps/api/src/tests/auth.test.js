import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../app.js";
import { registerUser } from "../services/userService.js";

describe("Auth", () => {
  beforeAll(async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "test@example.com",
      password: "password123",
      fullName: "Test User",
      role: "CLIENT",
    });

    expect(res.body.data.email).toBe("test@example.com");
    expect(res.body.data.role).toBe("CLIENT");
  });

  it("should reject registration without fullName", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "no-name@example.com",
      password: "password123",
      role: "CLIENT",
    });

    expect(res.status).toBe(400);
  });

  it("should preserve fullName in returned user payload", async () => {
    const user = await registerUser({
      email: "name-test@example.com",
      password: "password123",
      fullName: "Alice Bob",
      role: "FREELANCER",
    });

    expect(user.fullName).toBe("Alice Bob");
  });

  it("should reject empty fullName", async () => {
    await expect(
      registerUser({
        email: "empty-name@example.com",
        password: "password123",
        fullName: "",
        role: "CLIENT",
      })
    ).rejects.toThrow();
  });
});