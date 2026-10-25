import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { registerUser, loginUser, hashPassword, verifyPassword } from "../services/authService.js";
import { createUser, findUserByEmail } from "../services/userService.js";

async function withServer(fn) {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const { port } = server.address();
  try {
    return await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("hashPassword produces a verifiable scrypt digest and never stores plaintext", async () => {
  const hash = await hashPassword("correct-horse-battery");
  assert.match(hash, /^scrypt\$16384\$8\$1\$[0-9a-f]{32}\$[0-9a-f]{128}$/);
  assert.ok(!hash.includes("correct-horse-battery"));
  assert.equal(await verifyPassword("correct-horse-battery", hash), true);
  assert.equal(await verifyPassword("wrong-password", hash), false);
});

test("verifyPassword rejects malformed or non-scrypt hashes without throwing", async () => {
  for (const bad of ["", "plaintext", "bcrypt$x$y", "scrypt$1$2$3", null, undefined, 42]) {
    assert.equal(await verifyPassword("anything", bad), false);
  }
});

test("registerUser stores a scrypt hash and issues a token for the new user", async () => {
  const email = "newcomer@example.com";
  const result = await registerUser({ email, password: "sup3r-secret", role: "freelancer" });

  const stored = await findUserByEmail(email);
  assert.ok(stored, "registered user must be retrievable by email");
  assert.notEqual(stored.passwordHash, "sup3r-secret");
  assert.equal(await verifyPassword("sup3r-secret", stored.passwordHash), true);
  assert.equal(result.email, email);
  assert.equal(result.role, "freelancer");
  assert.ok(result.token && result.token.split(".").length === 3, "a signed JWT is returned");
});

test("findUserByEmail is case-insensitive and returns null for unknown users", async () => {
  await createUser({ email: "Mixed.Case@Example.com", passwordHash: "x" });
  assert.ok(await findUserByEmail("mixed.case@example.com"));
  assert.equal(await findUserByEmail("nobody@example.com"), null);
});

test("loginUser authenticates a registered user with the correct password", async () => {
  const email = "valid.user@example.com";
  await registerUser({ email, password: "right-password", role: "client" });

  const result = await loginUser({ email, password: "right-password" });
  assert.equal(result.email, email);
  assert.ok(result.token, "valid credentials return a token");
});

test("loginUser rejects a wrong password with a 401 and signs no token", async () => {
  const email = "wrong.pass@example.com";
  await registerUser({ email, password: "right-password", role: "client" });

  await assert.rejects(
    () => loginUser({ email, password: "totally-wrong" }),
    (err) => {
      assert.equal(err.status, 401);
      assert.equal(err.message, "Invalid email or password");
      return true;
    }
  );
});

test("loginUser rejects an unknown email instead of signing a token for an existing user", async () => {
  await assert.rejects(
    () => loginUser({ email: "ghost@example.com", password: "anything" }),
    (err) => err.status === 401
  );
});

test("POST /api/auth/login no longer returns a token for arbitrary credentials", async () => {
  await withServer(async (base) => {
    const attacker = await fetch(`${base}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "x@x.com", password: "anything" })
    });
    assert.equal(attacker.status, 401, "arbitrary credentials must be rejected");
    const body = await attacker.json();
    assert.equal(body.success, false);
    assert.equal(body.token, undefined, "no token may leak on a failed login");
  });
});

test("POST /api/auth/login returns 200 and a token for real credentials end to end", async () => {
  const email = `e2e.${Date.now()}@example.com`;
  const password = "integration-secret";

  await withServer(async (base) => {
    await fetch(`${base}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, role: "client" })
    });

    const response = await fetch(`${base}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    assert.equal(response.status, 200);
    const body = await response.json();
    assert.ok(body.data?.token, "successful login returns a token in the data envelope");
  });
});
