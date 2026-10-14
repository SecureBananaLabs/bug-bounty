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

  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function postProposal(baseUrl, body) {
  const response = await fetch(`${baseUrl}/api/proposals`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });

  return { response, payload: await response.json() };
}

test("POST /api/proposals rejects empty payloads", async () => {
  await withServer(async (baseUrl) => {
    const { response, payload } = await postProposal(baseUrl, {});

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
  });
});

test("POST /api/proposals rejects non-positive rates", async () => {
  await withServer(async (baseUrl) => {
    const { response, payload } = await postProposal(baseUrl, {
      jobId: "job_1",
      rate: 0,
      message: "I can help"
    });

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
  });
});

test("POST /api/proposals accepts valid proposals", async () => {
  await withServer(async (baseUrl) => {
    const { response, payload } = await postProposal(baseUrl, {
      jobId: "job_1",
      rate: 120,
      message: "I can help"
    });

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.jobId, "job_1");
    assert.equal(payload.data.rate, 120);
    assert.equal(payload.data.message, "I can help");
  });
});
