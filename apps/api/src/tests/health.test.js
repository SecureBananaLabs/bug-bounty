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

test("GET /health returns ok payload", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/health`);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(payload, { ok: true, service: "api" });
  });
});

test("validation failures return a 400 response", async () => {
  await withServer(async (baseUrl) => {
    const jobResponse = await fetch(`${baseUrl}/api/jobs`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "bad" })
    });
    const jobPayload = await jobResponse.json();

    assert.equal(jobResponse.status, 400);
    assert.equal(jobPayload.success, false);
    assert.equal(jobPayload.message, "Validation failed");
    assert.ok(jobPayload.issues.some((issue) => issue.path === "description"));
    assert.ok(jobPayload.issues.some((issue) => issue.path === "budgetMin"));

    const authResponse = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "not-an-email", password: "short" })
    });
    const authPayload = await authResponse.json();

    assert.equal(authResponse.status, 400);
    assert.equal(authPayload.success, false);
    assert.equal(authPayload.message, "Validation failed");
    assert.ok(authPayload.issues.some((issue) => issue.path === "email"));
    assert.ok(authPayload.issues.some((issue) => issue.path === "password"));
  });
});
