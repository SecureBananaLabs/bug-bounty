import test from "node:test";
import assert from "node:assert/strict";
import {
  AuthError,
  createAuthService,
  verifyPassword
} from "../services/authService.js";

function createFakeDatabase() {
  const users = new Map();

  return {
    users,
    user: {
      async findUnique({ where, select }) {
        const user = where.email
          ? [...users.values()].find((entry) => entry.email === where.email)
          : users.get(where.id);
        if (!user) return null;
        return Object.fromEntries(Object.keys(select).map((key) => [key, user[key]]));
      },
      async create({ data, select }) {
        const user = { id: `user-${users.size + 1}`, ...data };
        users.set(user.id, user);
        return Object.fromEntries(Object.keys(select).map((key) => [key, user[key]]));
      }
    }
  };
}

test("registration persists a password hash and cannot create an admin", async () => {
  const database = createFakeDatabase();
  const service = createAuthService({
    database,
    tokenSigner: (claims) => `token:${claims.sub}:${claims.role}`
  });
  const result = await service.registerUser({
    email: " Person@Example.Test ",
    password: "correct-horse-battery",
    fullName: "Test Person",
    role: "client"
  });
  const savedUser = database.users.get(result.id);

  assert.equal(result.email, "person@example.test");
  assert.equal(result.role, "client");
  assert.equal(savedUser.passwordHash.includes("correct-horse-battery"), false);
  assert.equal(await verifyPassword("correct-horse-battery", savedUser.passwordHash), true);
  assert.equal(await verifyPassword("incorrect-password", savedUser.passwordHash), false);
  await assert.rejects(
    () => service.registerUser({
      email: "admin@example.test",
      password: "correct-horse-battery",
      fullName: "Injected Admin",
      role: "admin"
    }),
    (error) => error instanceof AuthError && error.status === 400
  );
});

test("login verifies the persisted password and rejects unknown accounts", async () => {
  const database = createFakeDatabase();
  const service = createAuthService({
    database,
    tokenSigner: (claims) => `token:${claims.sub}:${claims.role}`
  });
  const created = await service.registerUser({
    email: "person@example.test",
    password: "correct-horse-battery",
    fullName: "Test Person",
    role: "freelancer"
  });

  const loggedIn = await service.loginUser({
    email: "PERSON@example.test",
    password: "correct-horse-battery"
  });
  assert.equal(loggedIn.id, created.id);
  assert.equal(loggedIn.token, `token:${created.id}:freelancer`);

  await assert.rejects(
    () => service.loginUser({ email: "person@example.test", password: "wrong-password" }),
    (error) => error instanceof AuthError && error.status === 401
  );
  await assert.rejects(
    () => service.loginUser({ email: "missing@example.test", password: "wrong-password" }),
    (error) => error instanceof AuthError && error.status === 401
  );
});

test("password verifier safely rejects malformed hashes", async () => {
  assert.equal(await verifyPassword("password", "not-a-hash"), false);
});
