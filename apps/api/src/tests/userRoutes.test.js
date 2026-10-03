import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

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

function userPayload() {
  const suffix = `${Date.now()}-${Math.random()}`;

  return {
    email: `user-${suffix}@example.com`,
    fullName: "Alex User",
    role: "client"
  };
}

test("POST /api/users returns 409 for duplicate email addresses", async () => {
  await withServer(async (baseUrl) => {
    const payload = userPayload();

    const firstResponse = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });

    const secondResponse = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...payload, fullName: "Alex Duplicate" })
    });
    const secondPayload = await secondResponse.json();

    assert.equal(firstResponse.status, 201);
    assert.equal(secondResponse.status, 409);
    assert.deepEqual(secondPayload, {
      success: false,
      message: `User with email ${payload.email} already exists`
    });

    const listResponse = await fetch(`${baseUrl}/api/users`);
    const listPayload = await listResponse.json();
    const matchingUsers = listPayload.data.filter(
      (user) => user.email === payload.email
    );

    assert.equal(matchingUsers.length, 1);
    assert.equal(matchingUsers[0].fullName, "Alex User");
  });
});
