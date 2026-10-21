import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { _resetProposals, listProposals } from "../services/proposalService.js";

test("Proposal Detail By ID & Array Encapsulation", async (t) => {
  let server;
  let baseUrl;

  t.beforeEach(async () => {
    _resetProposals();
    const app = createApp();
    server = app.listen(0);
    await new Promise((res) => server.once("listening", res));
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  t.afterEach(async () => {
    if (server) {
      await new Promise((res) => server.close(res));
    }
  });

  await t.test("GET /api/proposals/:id returns 404 when proposal does not exist", async () => {
    const res = await fetch(`${baseUrl}/api/proposals/non_existent_proposal`);
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.message, "Proposal not found");
  });

  await t.test("POST /api/proposals creates a proposal and GET /api/proposals/:id resolves it", async () => {
    const createRes = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId: "job_999",
        coverLetter: "I will build this feature efficiently.",
        bidAmount: 1500
      })
    });

    assert.equal(createRes.status, 201);
    const createBody = await createRes.json();
    assert.equal(createBody.success, true);
    const proposalId = createBody.data.id;
    assert.ok(proposalId);

    // Resolve by ID
    const getRes = await fetch(`${baseUrl}/api/proposals/${proposalId}`);
    assert.equal(getRes.status, 200);
    const getBody = await getRes.json();
    assert.equal(getBody.success, true);
    assert.equal(getBody.data.id, proposalId);
    assert.equal(getBody.data.jobId, "job_999");
    assert.equal(getBody.data.bidAmount, 1500);
  });

  await t.test("listProposals returns a defensive snapshot array", async () => {
    const createRes = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId: "job_888",
        coverLetter: "Skilled engineer.",
        bidAmount: 2000
      })
    });
    assert.equal(createRes.status, 201);

    const snapshot = await listProposals();
    assert.equal(snapshot.length, 1);
    snapshot.pop(); // Mutate the returned array

    const freshSnapshot = await listProposals();
    assert.equal(freshSnapshot.length, 1, "Backing store must remain uncorrupted");
  });
});
