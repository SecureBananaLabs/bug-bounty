import test from "node:test";
import assert from "node:assert/strict";

import { createApp } from "../app.js";

async function withServer(assertions) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await assertions(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function register(baseUrl, role) {
  return fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email: `test-${role}@example.com`,
      password: "supersecret",
      role
    })
  });
}

test("POST /api/auth/register rejects admin self-assignment", async () => {
  await withServer(async (baseUrl) => {
    const response = await register(baseUrl, "admin");
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.ok(payload.message.includes("Invalid"));
  });
});

test("POST /api/auth/register accepts public roles", async () => {
  await withServer(async (baseUrl) => {
    const clientResponse = await register(baseUrl, "client");
    const clientPayload = await clientResponse.json();
    assert.equal(clientResponse.status, 201);
    assert.equal(clientPayload.success, true);
    assert.equal(clientPayload.data.role, "client");

    const freelancerResponse = await register(baseUrl, "freelancer");
    const freelancerPayload = await freelancerResponse.json();
    assert.equal(freelancerResponse.status, 201);
    assert.equal(freelancerPayload.success, true);
    assert.equal(freelancerPayload.data.role, "freelancer");
  });
});
