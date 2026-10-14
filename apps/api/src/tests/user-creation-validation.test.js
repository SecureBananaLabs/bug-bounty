import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

const validUser = {
  email: "person@example.com",
  fullName: "Person Example",
  role: "client",
  bio: "Available for projects",
};

async function withServer(callback) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/users rejects invalid payloads", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "not-an-email" }),
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Invalid user payload",
    });
  });
});

test("POST /api/users creates valid users", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(validUser),
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.match(payload.data.id, /^usr_\d+$/);
    assert.equal(payload.data.email, validUser.email);
    assert.equal(payload.data.fullName, validUser.fullName);
    assert.equal(payload.data.role, validUser.role);
  });
});

test("POST /api/users defaults missing role to client", async () => {
  await withServer(async (baseUrl) => {
    const { role, ...userWithoutRole } = validUser;
    const response = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(userWithoutRole),
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.data.role, "client");
  });
});
