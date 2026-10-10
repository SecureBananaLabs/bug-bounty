import { describe, it, expect, beforeEach } from "vitest";
import { AuthService } from "./auth";

describe("AuthService", () => {
  let auth: AuthService;

  beforeEach(() => {
    auth = new AuthService();
  });

  it("should register a user and return consistent ID and JWT subject", async () => {
    const { userId, token } = await auth.registerUser("testuser");

    // Parse JWT without verification to check the subject
    const parts = token.split(".");
    const payload = JSON.parse(Buffer.from(parts[1], "base64").toString());

    expect(payload.sub).toBe(userId);
  });

  it("should return the same user ID in response and JWT when clock advances between calls", async () => {
    // Save original Date.now
    const originalNow = Date.now;

    // Mock Date.now to return different values on successive calls
    let callCount = 0;
    Date.now = () => {
      callCount++;
      // First call returns one timestamp, second returns a later one
      return 1000 + callCount * 1000;
    };

    try {
      const { userId, token } = await auth.registerUser("testuser");

      const parts = token.split(".");
      const payload = JSON.parse(Buffer.from(parts[1], "base64").toString());

      // This test would fail if registerUser uses separate Date.now() calls
      expect(payload.sub).toBe(userId);
    } finally {
      Date.now = originalNow;
    }
  });
});
