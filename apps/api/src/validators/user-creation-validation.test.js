import { createUserSchema } from "./user.js";

describe("User Creation Input Validation (#11575)", () => {
  it("should reject invalid email and short name", () => {
    const res = createUserSchema.safeParse({
      name: "A",
      email: "invalid-email-format",
      role: "freelancer"
    });

    expect(res.success).toBe(false);
  });

  it("should accept valid user creation payload", () => {
    const res = createUserSchema.safeParse({
      name: "John Doe",
      email: "john@example.com",
      role: "client"
    });

    expect(res.success).toBe(true);
  });
});
