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

test("POST /api/users does not persist or return submitted passwords", async () => {
  await withServer(async (baseUrl) => {
    const email = `password-redaction-${Date.now()}@example.com`;
    const createResponse = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Password Redaction",
        email,
        password: "super-secret-password"
      })
    });

    const created = await createResponse.json();

    assert.equal(createResponse.status, 201);
    assert.equal(created.success, true);
    assert.equal(created.data.email, email);
    assert.equal("password" in created.data, false);

    const listResponse = await fetch(`${baseUrl}/api/users`);
    const listed = await listResponse.json();
    const storedUser = listed.data.find((user) => user.email === email);

    assert.equal(listResponse.status, 200);
    assert.ok(storedUser);
    assert.equal("password" in storedUser, false);
  });
});
