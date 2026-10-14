import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

function createAuthToken(role) {
  return signAccessToken({ sub: `usr_${role}`, role });
}

test("GET /api/admin/metrics rejects authenticated non-admin users", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/admin/metrics`, {
      headers: {
        Authorization: `Bearer ${createAuthToken("freelancer")}`
      }
    });
    const payload = await response.json();

    assert.equal(response.status, 403);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Forbidden");
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("GET /api/admin/metrics allows admin users", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/admin/metrics`, {
      headers: {
        Authorization: `Bearer ${createAuthToken("admin")}`
      }
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.data.openJobs, 42);
    assert.equal(payload.data.activeFreelancers, 185);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
