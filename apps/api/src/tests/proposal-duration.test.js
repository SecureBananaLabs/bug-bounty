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
    return await callback(`http://127.0.0.1:${port}`);
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

const validProposal = {
  jobId: "job_123",
  freelancerId: "usr_456",
  coverLetter: "I can complete this safely.",
  bidAmount: 250,
  estDuration: "2 weeks"
};

test("proposal creation rejects missing estimated duration", async () => {
  await withServer(async (baseUrl) => {
    const { estDuration, ...payloadWithoutDuration } = validProposal;
    const { response, payload } = await postProposal(baseUrl, payloadWithoutDuration);

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Validation failed");
  });
});

test("proposal creation rejects blank estimated duration", async () => {
  await withServer(async (baseUrl) => {
    const { response, payload } = await postProposal(baseUrl, {
      ...validProposal,
      estDuration: "   "
    });

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Validation failed");
  });
});

test("proposal creation preserves valid estimated duration", async () => {
  await withServer(async (baseUrl) => {
    const { response, payload } = await postProposal(baseUrl, validProposal);

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.match(payload.data.id, /^prp_/);
    assert.equal(payload.data.estDuration, "2 weeks");
  });
});
