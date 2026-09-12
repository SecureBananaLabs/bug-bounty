import { describe, it, expect } from "vitest";
import { createNotificationSchema } from "../validators/notification.js";

describe("Notification Validation Schema", () => {
  it("should accept a valid notification with title only", () => {
    const valid = { title: "New message" };
    const result = createNotificationSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("should accept a valid notification with body", () => {
    const valid = { title: "New proposal", body: "You have a new proposal to review." };
    const result = createNotificationSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("should reject empty title", () => {
    const invalid = { title: "" };
    const result = createNotificationSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("should reject missing title", () => {
    const invalid = {};
    const result = createNotificationSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("should reject title over 200 characters", () => {
    const invalid = { title: "a".repeat(201) };
    const result = createNotificationSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("should reject body over 5000 characters", () => {
    const invalid = { title: "Test", body: "b".repeat(5001) };
    const result = createNotificationSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});
