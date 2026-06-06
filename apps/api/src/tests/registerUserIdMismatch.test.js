import { describe, it, expect } from "vitest";
import { registerUser } from "../services/authService.js";

describe("registerUser - consistent id in response and JWT", () => {
  it("should use the same id in the returned object and JWT subject", async () => {
    const result = await registerUser({
      email: "test@example.com",
      password: "secret1234",
      role: "client"
    });

    expect(result.id).toMatch(/^usr_\d+$/);
    expect(result.token).toBeDefined();

    // Decode JWT without verifying (just check the sub claim matches)
    const [, payload] = result.token.split(".");
    const decoded = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf-8")
    );

    expect(decoded.sub).toBe(result.id);
  });
});
