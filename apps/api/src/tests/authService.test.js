import { describe, it, expect } from "vitest";
import { registerUser } from "../services/authService.js";

describe("registerUser", () => {
  it("should return matching id and token sub", async () => {
    const result = await registerUser({ email: "test@test.com", role: "client" });
    // Extract sub from token to verify it matches id
    // The token sub should match the returned id
    const tokenParts = result.token.split(".");
    const payload = JSON.parse(Buffer.from(tokenParts[1], "base64").toString());
    expect(payload.sub).toBe(result.id);
  });

  it("should return consistent id across rapid calls", async () => {
    const results = await Promise.all(
      Array.from({ length: 10 }, () =>
        registerUser({ email: "bulk@test.com", role: "client" })
      )
    );
    for (const r of results) {
      const tokenParts = r.token.split(".");
      const payload = JSON.parse(Buffer.from(tokenParts[1], "base64").toString());
      expect(payload.sub).toBe(r.id);
    }
  });
});
