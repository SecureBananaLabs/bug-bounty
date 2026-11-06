import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { _resetProposals, listProposals } from "../services/proposalService.js";

test("Proposal Validation & Backing Array Encapsulation", async (t) => {
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

  await t.test("POST /api/proposals rejects payload with missing jobId", async () => {
    const res = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        coverLetter: "I have 5 years of experience in Node.js.",
        bidAmount: 500
      })
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
  });

  await t.test("POST /api/proposals rejects payload with empty coverLetter", async () => {
    const res = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId: "job_123",
        coverLetter: "   ",
        bidAmount: 500
      })
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
  });

  await t.test("POST /api/proposals rejects non-positive bid amounts (zero or negative)", async () => {
    const zeroRes = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId: "job_123",
        coverLetter: "Will deliver within 2 days.",
        bidAmount: 0
      })
    });

    assert.equal(zeroRes.status, 400);

    const negRes = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId: "job_123",
        coverLetter: "Will deliver within 2 days.",
        bidAmount: -250
      })
    });

    assert.equal(negRes.status, 400);
  });

  await t.test("POST /api/proposals accepts valid proposal and returns 201", async () => {
    const res = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId: "job_456",
        coverLetter: "Expert developer ready to build the feature.",
        bidAmount: 750
      })
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.jobId, "job_456");
    assert.equal(body.data.bidAmount, 750);
    assert.match(body.data.id, /^prp_/);
  });

  await t.test("listProposals returns a defensive snapshot array", async () => {
    const res = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId: "job_789",
        coverLetter: "Highly qualified freelancer.",
        bidAmount: 1200
      })
    });
    assert.equal(res.status, 201);

    const snapshot = await listProposals();
    assert.equal(snapshot.length, 1);
    snapshot.pop(); // Mutate the returned array

    const freshSnapshot = await listProposals();
    assert.equal(freshSnapshot.length, 1, "Backing store must remain uncorrupted");
  });
});
