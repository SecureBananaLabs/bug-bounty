import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(run) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    return await run(baseUrl);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }
}

test("POST /api/users with valid payload returns 201 and creates safe user", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "alice.security@example.com",
        fullName: "Alice Developer",
        role: "freelancer",
        bio: "Specialist in distributed systems and smart contract auditing."
      })
    });

    const body = await res.json();
    assert.equal(res.status, 201);
    assert.equal(body.success, true);
    assert.equal(body.data.email, "alice.security@example.com");
    assert.equal(body.data.fullName, "Alice Developer");
    assert.equal(body.data.role, "freelancer");
    assert.ok(body.data.id.startsWith("usr_"));
  });
});

test("POST /api/users excludes plaintext password from persisted entity", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "bob.quant@example.com",
        fullName: "Bob Quant",
        password: "SuperSecretPassword123!"
      })
    });

    const body = await res.json();
    assert.equal(res.status, 201);
    assert.equal(body.success, true);
    assert.equal(body.data.email, "bob.quant@example.com");
    assert.equal(body.data.password, undefined, "Plaintext password must never be persisted");
  });
});

test("POST /api/users rejects invalid email format with 400 Bad Request", async () => {
  await withServer(async (baseUrl) => {
    for (const badEmail of ["not-an-email", "@missing-user.com", "user@", "spaces in@mail.com"]) {
      const res = await fetch(`${baseUrl}/api/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: badEmail,
          fullName: "Invalid Email User"
        })
      });

      const body = await res.json();
      assert.equal(res.status, 400);
      assert.equal(body.success, false);
      assert.equal(body.message, "Validation failed");
      assert.ok(Array.isArray(body.issues));
    }
  });
});

test("POST /api/users rejects missing fullName with 400 Bad Request", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test.missing.name@example.com"
      })
    });

    const body = await res.json();
    assert.equal(res.status, 400);
    assert.equal(body.success, false);
    assert.equal(body.message, "Validation failed");
  });
});

test("POST /api/users rejects too short fullName (<2 chars) with 400", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test.short@example.com",
        fullName: "A"
      })
    });

    const body = await res.json();
    assert.equal(res.status, 400);
    assert.equal(body.success, false);
    assert.equal(body.message, "Validation failed");
  });
});

test("POST /api/users rejects invalid role with 400", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test.role@example.com",
        fullName: "Test Role",
        role: "super_admin_exploit"
      })
    });

    const body = await res.json();
    assert.equal(res.status, 400);
    assert.equal(body.success, false);
    assert.equal(body.message, "Validation failed");
  });
});

test("POST /api/users rejects unknown extra properties (strict schema) with 400", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test.strict@example.com",
        fullName: "Test Strict",
        injectedField: "exploit_value"
      })
    });

    const body = await res.json();
    assert.equal(res.status, 400);
    assert.equal(body.success, false);
    assert.equal(body.message, "Validation failed");
  });
});
