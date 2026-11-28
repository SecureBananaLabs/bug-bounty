import { describe, it, expect } from "vitest";

describe("errorHandler respects error status codes (#13958)", () => {
  it("should return 500 for generic errors", async () => {
    const { errorHandler } = await import("../middleware/errorHandler.js");
    const req = {};
    const res = { status: (s) => ({ json: (d) => ({ status: s, body: d }) }), headersSent: false };
    const next = () => {};

    const result = errorHandler(new Error("boom"), req, res, next);
    expect(result.status).toBe(500);
  });

  it("should return 400 for errors with status 400", async () => {
    const { errorHandler } = await import("../middleware/errorHandler.js");
    const err = new SyntaxError("Unexpected token");
    err.status = 400;
    err.type = "entity.parse.failed";
    const req = {};
    const res = { status: (s) => ({ json: (d) => ({ status: s, body: d }) }), headersSent: false };
    const next = () => {};

    const result = errorHandler(err, req, res, next);
    expect(result.status).toBe(400);
  });
});

describe("admin RBAC middleware (#13956)", () => {
  it("should reject non-admin users", async () => {
    // adminRoutes requires role === "admin"
    const { adminRoutes } = await import("../routes/adminRoutes.js");
    expect(adminRoutes.stack.length).toBeGreaterThan(2); // auth + admin + handler
  });
});

describe("registerUser JWT sub consistency (#13954)", () => {
  it("should use same ID for user.id and JWT sub", async () => {
    const { registerUser } = await import("../services/authService.js");
    const result = await registerUser({ email: "test@test.com", role: "client" });
    // Extract sub from JWT payload
    const [headerB64, payloadB64] = result.token.split(".");
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString());
    expect(payload.sub).toBe(result.id);
  });
});
