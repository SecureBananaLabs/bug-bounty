import assert from "node:assert/strict";
import test from "node:test";
import { hashPassword } from "../services/passwordService.js";
import { verifyAccessToken } from "../utils/jwt.js";

const users = new Map();

const originalFindUnique = globalThis.__authTestFindUnique;

function installPrismaMock() {
  globalThis.__authTestFindUnique = async ({ where, select }) => {
    const user = users.get(where.email);

    if (!user) {
      return null;
    }

    return Object.fromEntries(
      Object.entries(select)
        .filter(([, enabled]) => enabled)
        .map(([key]) => [key, user[key]])
    );
  };
}

installPrismaMock();

const { loginUser, AuthenticationError } = await import("../services/authService.js");

test.beforeEach(async () => {
  users.clear();

  users.set("architect@example.com", {
    id: "usr_architect_001",
    email: "architect@example.com",
    role: "freelancer",
    passwordHash: await hashPassword("correct-horse-battery-staple")
  });
});

test("valid credentials issue a JWT for the persisted subject and role", async () => {
  const result = await loginUser({
    email: "ARCHITECT@EXAMPLE.COM",
    password: "correct-horse-battery-staple"
  });

  assert.equal(result.email, "architect@example.com");
  assert.equal(typeof result.token, "string");

  const claims = verifyAccessToken(result.token);

  assert.equal(claims.sub, "usr_architect_001");
  assert.equal(claims.role, "freelancer");
});

test("unknown email is rejected with a generic 401 authentication error", async () => {
  await assert.rejects(
    loginUser({
      email: "missing@example.com",
      password: "correct-horse-battery-staple"
    }),
    (error) =>
      error instanceof AuthenticationError &&
      error.statusCode === 401 &&
      error.message === "Invalid email or password"
  );
});

test("wrong password is rejected with the same generic 401 authentication error", async () => {
  await assert.rejects(
    loginUser({
      email: "architect@example.com",
      password: "incorrect-password"
    }),
    (error) =>
      error instanceof AuthenticationError &&
      error.statusCode === 401 &&
      error.message === "Invalid email or password"
  );
});

test("empty credentials cannot mint a token", async () => {
  await assert.rejects(
    loginUser({ email: "", password: "" }),
    (error) => error instanceof AuthenticationError && error.statusCode === 401
  );
});

test("malformed persisted password hashes fail closed", async () => {
  users.set("broken@example.com", {
    id: "usr_broken_001",
    email: "broken@example.com",
    role: "client",
    passwordHash: "not-a-scrypt-hash"
  });

  await assert.rejects(
    loginUser({
      email: "broken@example.com",
      password: "anything"
    }),
    (error) => error instanceof AuthenticationError && error.statusCode === 401
  );
});
