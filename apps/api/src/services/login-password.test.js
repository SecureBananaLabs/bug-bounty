import { loginUser } from "./authService.js";

describe("Login Password Verification Hardening (#11596)", () => {
  it("should reject invalid short passwords", async () => {
    await expect(loginUser({ email: "test@example.com", password: "123" })).rejects.toThrow();
  });

  it("should accept valid password format", async () => {
    const result = await loginUser({ email: "test@example.com", password: "validPassword123" });
    expect(result.token).toBeDefined();
  });
});
