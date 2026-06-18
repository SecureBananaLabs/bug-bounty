import test from "node:test";
import assert from "node:assert/strict";

import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

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

function authHeader(role) {
  return {
    Authorization: `Bearer ${signAccessToken({ sub: `usr_${role}`, role })}`
  };
}

test("GET /api/admin/metrics rejects missing and non-admin tokens", async () => {
  await withServer(async (baseUrl) => {
    const missingResponse = await fetch(`${baseUrl}/api/admin/metrics`);
    const missingPayload = await missingResponse.json();

    assert.equal(missingResponse.status, 401);
    assert.equal(missingPayload.success, false);
    assert.equal(missingPayload.message, "Unauthorized");

    const clientResponse = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: authHeader("client")
    });
    const clientPayload = await clientResponse.json();

    assert.equal(clientResponse.status, 403);
    assert.equal(clientPayload.success, false);
    assert.equal(clientPayload.message, "Forbidden");
  });
});

test("GET /api/admin/metrics allows admin tokens", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: authHeader("admin")
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.data.openJobs, 42);
    assert.equal(payload.data.activeFreelancers, 185);
  });
});
