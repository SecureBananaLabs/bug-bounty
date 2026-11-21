import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

async function withServer(run) {
  const server = createApp().listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const { port } = server.address();
  try {
    return await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

function authHeaders(role = "client") {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${signAccessToken({ sub: "usr_requester", role })}`
  };
}

test("POST /api/users rejects requests without a token", async () => {
  await withServer(async (base) => {
    const response = await fetch(`${base}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "anon@example.com" })
    });

    assert.equal(response.status, 401);
    assert.equal((await response.json()).message, "Unauthorized");
  });
});

test("POST /api/users rejects a malformed token", async () => {
  await withServer(async (base) => {
    const response = await fetch(`${base}/api/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer broken"
      },
      body: JSON.stringify({ email: "anon@example.com" })
    });

    assert.equal(response.status, 401);
    assert.equal((await response.json()).message, "Invalid token");
  });
});

test("POST /api/users creates a user for an authenticated caller", async () => {
  await withServer(async (base) => {
    const response = await fetch(`${base}/api/users`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ email: "new@example.com", name: "New User" })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.match(payload.data.id, /^usr_/);
    assert.equal(payload.data.role, "client");
  });
});

test("POST /api/users ignores a client-supplied id", async () => {
  await withServer(async (base) => {
    const response = await fetch(`${base}/api/users`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ id: "usr_admin_override", email: "spoof@example.com" })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.notEqual(payload.data.id, "usr_admin_override");
    assert.match(payload.data.id, /^usr_/);
  });
});

test("POST /api/users blocks self-promotion to admin", async () => {
  await withServer(async (base) => {
    const response = await fetch(`${base}/api/users`, {
      method: "POST",
      headers: authHeaders("client"),
      body: JSON.stringify({ email: "sneaky@example.com", role: "admin" })
    });

    assert.equal(response.status, 403);
    assert.equal((await response.json()).message, "Forbidden");
  });
});

test("an admin caller can create an admin user", async () => {
  await withServer(async (base) => {
    const response = await fetch(`${base}/api/users`, {
      method: "POST",
      headers: authHeaders("admin"),
      body: JSON.stringify({ email: "boss@example.com", role: "admin" })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.data.role, "admin");
  });
});

test("GET /api/users stays public", async () => {
  await withServer(async (base) => {
    const response = await fetch(`${base}/api/users`);

    assert.equal(response.status, 200);
    assert.equal((await response.json()).success, true);
  });
});
