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
    await run(port);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

const validProposal = {
  coverLetter: "I can deliver this quickly.",
  bidAmount: 250,
  estDuration: "2 weeks",
  jobId: "job_test",
  freelancerId: "usr_test"
};

test("POST /api/proposals rejects zero, negative, and non-numeric bid amounts", async () => {
  await withServer(async (port) => {
    for (const bidAmount of [0, -500, "oops"]) {
      const response = await fetch(`http://127.0.0.1:${port}/api/proposals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...validProposal, bidAmount })
      });
      const payload = await response.json();

      assert.equal(response.status, 400);
      assert.equal(payload.success, false);
      assert.equal(payload.message, "bidAmount must be a positive number");
    }
  });
});

test("POST /api/proposals accepts a positive numeric bidAmount", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/proposals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validProposal)
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.bidAmount, 250);
    assert.equal(payload.data.coverLetter, validProposal.coverLetter);
    assert.match(payload.data.id, /^prp_/);
  });
});
