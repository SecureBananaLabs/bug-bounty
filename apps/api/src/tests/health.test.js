import { describe, it, expect } from "vitest";
import { registerUser } from "../services/authService.js";
import { verifyToken } from "../utils/jwt.js";

describe("health", () => {
  it("responds with ok", async () => {
    const res = await import("../app.js").then((m) => m.default);
    expect(res).toBeDefined();
  });
});

describe("registration token subject consistency", () => {
  it("returns a user id that matches the JWT sub claim", async () => {
    const email = `drift-test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
    const result = await registerUser({
      email,
      password: "password123",
      name: "Drift Test"
    });

    expect(result.id).toBeDefined();
    expect(result.token).toBeDefined();

    const decoded = verifyToken(result.token);
    expect(decoded.sub).toBe(result.id);
  });
});
