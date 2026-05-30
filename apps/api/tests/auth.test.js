import { registerSchema, loginSchema } from "../validators/auth.js";

describe("Auth Validation", () => {
  describe("registerSchema", () => {
    it("should accept valid client registration", () => {
      const result = registerSchema.parse({
        email: "user@example.com",
        password: "password123",
        role: "client"
      });
      expect(result.role).toBe("client");
    });

    it("should accept valid freelancer registration", () => {
      const result = registerSchema.parse({
        email: "freelancer@example.com",
        password: "password123",
        role: "freelancer"
      });
      expect(result.role).toBe("freelancer");
    });

    it("should default to client role when no role provided", () => {
      const result = registerSchema.parse({
        email: "user@example.com",
        password: "password123"
      });
      expect(result.role).toBe("client");
    });

    it("should reject admin role assignment", () => {
      expect(() => {
        registerSchema.parse({
          email: "admin@example.com",
          password: "password123",
          role: "admin"
        });
      }).toThrow();
    });

    it("should reject invalid email", () => {
      expect(() => {
        registerSchema.parse({
          email: "not-an-email",
          password: "password123"
        });
      }).toThrow();
    });

    it("should reject short password", () => {
      expect(() => {
        registerSchema.parse({
          email: "user@example.com",
          password: "123"
        });
      }).toThrow();
    });
  });

  describe("loginSchema", () => {
    it("should accept valid login data", () => {
      const result = loginSchema.parse({
        email: "user@example.com",
        password: "password123"
      });
      expect(result.email).toBe("user@example.com");
    });
  });
});
