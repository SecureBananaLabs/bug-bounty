import test from "node:test";
import assert from "node:assert/strict";
import { loginSchema, refreshSchema, registerSchema } from "../validators/auth.js";
import { refreshToken } from "../services/authService.js";
import { signAccessToken, verifyAccessToken } from "../utils/jwt.js";

test("register schema defaults public users to client role", () => {
  const payload = registerSchema.parse({
    email: "client@example.com",
    password: "strong-password"
  });

  assert.equal(payload.role, "client");
});

test("register schema allows only public registration roles", () => {
  assert.equal(registerSchema.parse({
    email: "client@example.com",
    password: "strong-password",
    role: "client"
  }).role, "client");

  assert.equal(registerSchema.parse({
    email: "freelancer@example.com",
    password: "strong-password",
    role: "freelancer"
  }).role, "freelancer");

  assert.throws(() => registerSchema.parse({
    email: "admin@example.com",
    password: "strong-password",
    role: "admin"
  }));
});

test("refresh schema requires a submitted token", () => {
  assert.equal(refreshSchema.parse({ token: "existing-token" }).token, "existing-token");
  assert.throws(() => refreshSchema.parse({}));
  assert.throws(() => refreshSchema.parse({ token: "" }));
});

test("login schema remains email and password only", () => {
  const payload = loginSchema.parse({
    email: "user@example.com",
    password: "strong-password"
  });

  assert.deepEqual(payload, {
    email: "user@example.com",
    password: "strong-password"
  });
});

test("refresh token verifies submitted token and preserves claims", async () => {
  const original = signAccessToken({ sub: "usr_refresh", role: "freelancer" });
  const result = await refreshToken(original);
  const refreshed = verifyAccessToken(result.token);

  assert.equal(refreshed.sub, "usr_refresh");
  assert.equal(refreshed.role, "freelancer");
});

test("refresh token rejects invalid submitted token", async () => {
  await assert.rejects(() => refreshToken("not-a-valid-token"));
});
