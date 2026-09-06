import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

async function startServer() {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      }),
  };
}

async function postProposal(baseUrl, proposal) {
  const response = await fetch(`${baseUrl}/api/proposals`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(proposal),
  });

  assert.equal(response.status, 201);
  return response.json();
}

async function getProposals(baseUrl, token) {
  return fetch(`${baseUrl}/api/proposals`, {
    headers: token ? { authorization: `Bearer ${token}` } : undefined,
  });
}

test("GET /api/proposals requires auth and returns only participant proposals", async () => {
  const server = await startServer();

  try {
    await postProposal(server.baseUrl, {
      jobId: "job_private_a",
      freelancerId: "usr_a",
      clientId: "client_x",
      bidAmount: 100,
      coverLetter: "Private proposal A",
    });
    await postProposal(server.baseUrl, {
      jobId: "job_private_b",
      freelancerId: "usr_b",
      clientId: "usr_a",
      bidAmount: 200,
      coverLetter: "Private proposal B",
    });
    await postProposal(server.baseUrl, {
      jobId: "job_private_c",
      freelancerId: "usr_c",
      clientId: "client_y",
      bidAmount: 300,
      coverLetter: "Private proposal C",
    });

    const anonymousResponse = await getProposals(server.baseUrl);
    assert.equal(anonymousResponse.status, 401);

    const missingSubjectResponse = await getProposals(
      server.baseUrl,
      signAccessToken({ role: "freelancer" }),
    );
    assert.equal(missingSubjectResponse.status, 401);

    const userAResponse = await getProposals(
      server.baseUrl,
      signAccessToken({ sub: "usr_a", role: "freelancer" }),
    );
    const userAPayload = await userAResponse.json();

    assert.equal(userAResponse.status, 200);
    assert.deepEqual(
      userAPayload.data.map((proposal) => proposal.jobId).sort(),
      ["job_private_a", "job_private_b"],
    );

    const userCResponse = await getProposals(
      server.baseUrl,
      signAccessToken({ sub: "usr_c", role: "freelancer" }),
    );
    const userCPayload = await userCResponse.json();

    assert.equal(userCResponse.status, 200);
    assert.deepEqual(
      userCPayload.data.map((proposal) => proposal.jobId),
      ["job_private_c"],
    );
  } finally {
    await server.close();
  }
});
