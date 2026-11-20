import { describe, it, expect, vi } from "vitest";
import { register } from "../controllers/authController.js";
import { isValidPublicRole, isForbiddenPublicRole, PUBLIC_ROLES } from "../utils/roles.js";

function createMockResponse() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe("Role Utility Functions", () => {
  it(" should identify allowed public roles", () => {
    expect(isValidPublicRole("client")).toBe(true);
    expect(isValidPublicRole("freelancer")).toBe(true);
    expect(isValidPublicRole("CLIENT")).toBe(true);
    expect(isValidPublicRole(" Freelancer ")).toBe(true);
  });

  it("should reject admin and unknown roles as public roles", () => {
    expect(isValidPublicRole("admin")).toBe(false);
    expect(isValidPublicRole("ADMIN")).toBe(false);
    expect(isValidPublicRole("superuser")).toBe(false);
    expect(isValidPublicRole("")).toBe(false);
    expect(isValidPublicRole(null)).toBe(false);
    expect(isValidPublicRole(undefined)).toBe(false);
  });

  it("should identify forbidden roles", () => {
    expect(isForbiddenPublicRole("admin")).toBe(true);
    expect(isForbiddenPublicRole("ADMIN")).toBe(true);
    expect(isForbiddenPublicRole("client")).toBe(false);
  });
});

describe("Registration Controller Role Restrictions", () => {
  it("should register successfully with default role 'client' when role is omitted", async () => {
    const req = { body: { email: "user@example.com", password: "securePass123!" } };
    const res = createMockResponse();

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      user: expect.objectContaining({
        email: "user@example.com",
        role: "client",
      }),
    }));
  });

  it("should register successfully with explicit 'freelancer' role", async () => {
    const req = { body: { email: "dev@example.com", password: "securePass123!", role: "freelancer" } };
    const res = createMockResponse();

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      user: expect.objectContaining({
        email: "dev@example.com",
        role: "freelancer",
      }),
    }));
  });

  it("should reject public registration when role is 'admin'", async () => {
    const req = { body: { email: "hacker@example.com", password: "pass", role: "admin" } };
    const res = createMockResponse();

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: `Role 'admin' is not permitted for public registration. Allowed roles: ${PUBLIC_ROLES.join(", ")}`,
    });
  });

  it("should reject public registration when role is uppercase 'ADMIN'", async () => {
    const req = { body: { email: "hacker2@example.com", password: "pass", role: "ADMIN" } };
    const res = createMockResponse();

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: expect.stringContaining("not permitted"),
    }));
  });

  it("should reject registration when role is padded ' admin '", async () => {
    const req = { body: { email: "hacker3@example.com", password: "pass", role: " admin " } };
    const res = createMockResponse();

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("should reject registration when email or password is missing", async () => {
    const reqNoEmail = { body: { password: "pass", role: "client" } };
    const res1 = createMockResponse();
    await register(reqNoEmail, res1);
    expect(res1.status).toHaveBeenCalledWith(400);
    expect(res1.json).toHaveBeenCalledWith({ error: "Email and password are required." });

    const reqNoPass = { body: { email: "test@example.com", role: "client" } };
    const res2 = createMockResponse();
    await register(reqNoPass, res2);
    expect(res2.status).toHaveBeenCalledWith(400);
  });

  it("should reject invalid non-public roles such as 'root' or 'moderator'", async () => {
    const req = { body: { email: "mod@example.com", password: "pass", role: "moderator" } };
    const res = createMockResponse();

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: expect.stringContaining("Allowed roles:"),
    }));
  });
});
