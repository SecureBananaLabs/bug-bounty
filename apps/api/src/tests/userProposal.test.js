import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(fn) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function postJson(url, body) {
  return fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
}

test("POST /api/users keeps user id server-owned", async () => {
  await withServer(async (baseUrl) => {
    const response = await postJson(`${baseUrl}/api/users`, {
      id: "usr_attacker_controlled",
      name: "Example User",
      email: "user@example.com"
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.notEqual(payload.data.id, "usr_attacker_controlled");
    assert.match(payload.data.id, /^usr_\d+$/);
  });
});

test("POST /api/proposals keeps proposal id server-owned", async () => {
  await withServer(async (baseUrl) => {
    const response = await postJson(`${baseUrl}/api/proposals`, {
      id: "prp_attacker_controlled",
      jobId: "job_123",
      freelancerId: "usr_123",
      coverLetter: "I can complete this job."
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.notEqual(payload.data.id, "prp_attacker_controlled");
    assert.match(payload.data.id, /^prp_\d+$/);
  });
});
