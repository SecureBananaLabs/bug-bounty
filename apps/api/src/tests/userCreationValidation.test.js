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

  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function postUser(baseUrl, payload) {
  return fetch(`${baseUrl}/api/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

const validUser = {
  name: "Maya Patel",
  email: "maya@example.com",
  role: "freelancer"
};

test("POST /api/users rejects empty payloads", async () => {
  await withServer(async (baseUrl) => {
    const response = await postUser(baseUrl, {});
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(body, { success: false, message: "Invalid user payload" });
  });
});

test("POST /api/users rejects invalid email values", async () => {
  await withServer(async (baseUrl) => {
    const response = await postUser(baseUrl, {
      ...validUser,
      email: "not-an-email"
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(body, { success: false, message: "Invalid user payload" });
  });
});

test("POST /api/users rejects client-controlled ids", async () => {
  await withServer(async (baseUrl) => {
    const response = await postUser(baseUrl, {
      ...validUser,
      id: "usr_attacker"
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(body, { success: false, message: "Invalid user payload" });
  });
});

test("POST /api/users stores valid users with server-generated id", async () => {
  await withServer(async (baseUrl) => {
    const response = await postUser(baseUrl, validUser);
    const body = await response.json();

    assert.equal(response.status, 201);
    assert.equal(body.success, true);
    assert.match(body.data.id, /^usr_/);
    assert.equal(body.data.name, validUser.name);
    assert.equal(body.data.email, validUser.email);
    assert.equal(body.data.role, validUser.role);
  });
});

test("POST /api/users defaults missing role to client", async () => {
  await withServer(async (baseUrl) => {
    const { role, ...payload } = validUser;
    const response = await postUser(baseUrl, payload);
    const body = await response.json();

    assert.equal(response.status, 201);
    assert.equal(body.success, true);
    assert.equal(body.data.role, "client");
  });
});
