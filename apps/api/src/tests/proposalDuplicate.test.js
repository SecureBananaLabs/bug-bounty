import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { createProposal, DuplicateProposalError, listProposals } from "../services/proposalService.js";

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

test("createProposal rejects duplicate freelancer proposals for one job", async () => {
  const beforeCount = (await listProposals()).length;
  await createProposal({ jobId: "job_1", freelancerId: "usr_1", bidAmount: 100 });

  await assert.rejects(
    () => createProposal({ jobId: "job_1", freelancerId: "usr_1", bidAmount: 120 }),
    DuplicateProposalError
  );

  assert.equal((await listProposals()).length, beforeCount + 1);
});

test("createProposal allows same freelancer on another job and another freelancer on same job", async () => {
  const first = await createProposal({ jobId: "job_2", freelancerId: "usr_2", bidAmount: 100 });
  const second = await createProposal({ jobId: "job_3", freelancerId: "usr_2", bidAmount: 100 });
  const third = await createProposal({ jobId: "job_2", freelancerId: "usr_3", bidAmount: 100 });

  assert.equal(first.jobId, "job_2");
  assert.equal(second.jobId, "job_3");
  assert.equal(third.freelancerId, "usr_3");
});

test("POST /api/proposals maps duplicate proposals to HTTP 409", async () => {
  await withServer(async (baseUrl) => {
    const payload = { jobId: "job_route", freelancerId: "usr_route", bidAmount: 100 };
    const first = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
    const second = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...payload, bidAmount: 120 })
    });
    const errorPayload = await second.json();

    assert.equal(first.status, 201);
    assert.equal(second.status, 409);
    assert.deepEqual(errorPayload, {
      success: false,
      message: "Proposal already exists for job job_route and freelancer usr_route"
    });
  });
});
