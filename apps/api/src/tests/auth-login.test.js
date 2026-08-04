import test from "node:test";
import assert from "node:assert/strict";
import { registerUser, loginUser } from "../services/authService.js";

test("register stores user, login verifies password", async () => {
  const reg = await registerUser({ email: "test@example.com", password: "secret123", role: "freelancer" });
  assert.ok(reg.token, "register returns token");

  const login = await loginUser({ email: "test@example.com", password: "secret123" });
  assert.ok(login.token, "login returns token with correct password");
});

test("login rejects wrong password", async () => {
  await registerUser({ email: "wrong@example.com", password: "realpass", role: "client" });
  await assert.rejects(
    () => loginUser({ email: "wrong@example.com", password: "notrealpass" }),
    { message: "Invalid credentials" }
  );
});

test("login rejects unknown email", async () => {
  await assert.rejects(
    () => loginUser({ email: "nobody@example.com", password: "anypass" }),
    { message: "Invalid credentials" }
  );
});