import { describe, it, expect } from "vitest";
import { createUser, listUsers } from "../src/services/userService.js";

describe("userService payload validation and mass assignment protection", () => {
  it("should create user with valid name and email", async () => {
    const user = await createUser({ name: "Alice", email: "alice@example.com" });
    expect(user).toHaveProperty("id");
    expect(user.id).toMatch(/^usr_\d+$/);
    expect(user.name).toBe("Alice");
    expect(user.email).toBe("alice@example.com");
  });

  it("should prevent mass assignment of sensitive/unexpected properties", async () => {
    const payload = {
      name: "Bob",
      email: "bob@example.com",
      id: "custom_id_override",
      role: "admin",
      isAdmin: true
    };
    const user = await createUser(payload);
    expect(user.id).not.toBe("custom_id_override");
    expect(user.role).toBeUndefined();
    expect(user.isAdmin).toBeUndefined();
  });

  it("should throw error if payload is missing or invalid type", async () => {
    await expect(createUser(null)).rejects.toThrow("Invalid payload");
    await expect(createUser("invalid")).rejects.toThrow("Invalid payload");
  });

  it("should throw error if required fields are missing", async () => {
    await expect(createUser({ email: "test@example.com" })).rejects.toThrow("'name' is required");
    await expect(createUser({ name: "Test" })).rejects.toThrow("'email' is required");
  });
});
