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

test("POST /api/proposals returns 201 for valid payloads", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        jobId: "job-101",
        freelancerId: "usr_2",
        coverLetter: "I can do this work.",
        estimatedDuration: "3 days"
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.jobId, "job-101");
    assert.equal(payload.data.freelancerId, "usr_2");
    assert.equal(payload.data.coverLetter, "I can do this work.");
    assert.equal(payload.data.estimatedDuration, "3 days");
  });
});

test("POST /api/proposals returns 400 for invalid payloads", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        jobId: "",
        freelancerId: "",
        coverLetter: "",
        estimatedDuration: ""
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Invalid proposal request");
    assert.ok(Array.isArray(payload.issues));
    assert.ok(payload.issues.some((issue) => issue.path.includes("jobId")));
  });
});

test("POST /api/proposals ignores caller supplied system fields", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        id: "prp_bad",
        jobId: "job-102",
        freelancerId: "usr_4",
        coverLetter: "Ready to help.",
        estimatedDuration: "1 week"
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.notEqual(payload.data.id, "prp_bad");
    assert.equal(payload.data.jobId, "job-102");
    assert.equal(payload.data.freelancerId, "usr_4");
  });
});
