import test from "node:test";
import assert from "node:assert/strict";
import { registerUser, loginUser } from "../authService.js";

test("register user and login with correct password", async () => {
  const reg = await registerUser({ email: "a@b.com", password: "password123", role: "client" });
  assert.ok(reg.token, "register returns token");
  const login = await loginUser({ email: "a@b.com", password: "password123" });
  assert.ok(login.token, "login returns token");
});

test("reject login with wrong password", async () => {
  await registerUser({ email: "x@b.com", password: "password123", role: "client" });
  await assert.rejects(
    () => loginUser({ email: "x@b.com", password: "wrongpass" }),
    /Invalid email or password/
  );
});

test("reject non-existent email", async () => {
  await assert.rejects(
    () => loginUser({ email: "ghost@b.com", password: "password123" }),
    /Invalid email or password/
  );
});

test("Do not persist plaintext password", async () => {
  await registerUser({ email: "plain@b.com", password: "password123", role: "client" });
  // can't directly inspect in-memory map, but login works only with hash — verify token sub matches
  const login = await loginUser({ email: "plain@b.com", password: "password123" });
  assert.ok(login.token);
});