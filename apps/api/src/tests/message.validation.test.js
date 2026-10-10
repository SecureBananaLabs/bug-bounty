import { describe, it, expect } from "vitest";
import { createMessageSchema } from "../validators/message.js";

describe("Message Validation Schema", () => {
  it("should accept a valid message", () => {
    const valid = { content: "Hello!", sender: "user_1", recipient: "user_2" };
    const result = createMessageSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("should reject empty content", () => {
    const invalid = { content: "", sender: "user_1", recipient: "user_2" };
    const result = createMessageSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("should reject missing sender", () => {
    const invalid = { content: "Hello!", recipient: "user_2" };
    const result = createMessageSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("should reject missing recipient", () => {
    const invalid = { content: "Hello!", sender: "user_1" };
    const result = createMessageSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("should reject content over 5000 characters", () => {
    const invalid = { content: "a".repeat(5001), sender: "user_1", recipient: "user_2" };
    const result = createMessageSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});
