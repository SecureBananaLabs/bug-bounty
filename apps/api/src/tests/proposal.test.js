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

  try {
    const { port } = server.address();
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/proposals preserves server-generated ids", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: "prp_attacker_supplied",
        jobId: "job_123",
        freelancerId: "usr_456",
        coverLetter: "I can complete this project safely."
      })
    });

    const created = await response.json();

    assert.equal(response.status, 201);
    assert.match(created.data.id, /^prp_\d+$/);
    assert.notEqual(created.data.id, "prp_attacker_supplied");
    assert.equal(created.data.jobId, "job_123");

    const listResponse = await fetch(`${baseUrl}/api/proposals`);
    const listed = await listResponse.json();

    assert.equal(listResponse.status, 200);
    assert.equal(listed.data.at(-1).id, created.data.id);
    assert.notEqual(listed.data.at(-1).id, "prp_attacker_supplied");
  });
});
