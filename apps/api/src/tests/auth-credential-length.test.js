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
    await run(baseUrl);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/auth register/login rejects oversized credentials payloads", async () => {
  await withServer(async (baseUrl) => {
    const oversizedPassword = "a".repeat(129);
    const registerResponse = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: "oversize@example.com",
        password: oversizedPassword,
        role: "client"
      })
    });
    const registerPayload = await registerResponse.json();

    assert.equal(registerResponse.status, 400);
    assert.equal(registerPayload.success, false);

    const oversizedEmail = `${"a".repeat(249)}@x.com`;
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: oversizedEmail,
        password: "validpass123"
      })
    });
    const loginPayload = await loginResponse.json();

    assert.equal(loginResponse.status, 400);
    assert.equal(loginPayload.success, false);
  });
});

test("POST /api/auth register/login accepts normal credential lengths", async () => {
  await withServer(async (baseUrl) => {
    const registerResponse = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: "normal@example.com",
        password: "validpass123",
        role: "client"
      })
    });
    const registerPayload = await registerResponse.json();

    assert.equal(registerResponse.status, 201);
    assert.equal(registerPayload.success, true);
    assert.equal(registerPayload.data.email, "normal@example.com");

    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: "normal@example.com",
        password: "validpass123"
      })
    });
    const loginPayload = await loginResponse.json();

    assert.equal(loginResponse.status, 200);
    assert.equal(loginPayload.success, true);
    assert.equal(loginPayload.data.email, "normal@example.com");
  });
});
