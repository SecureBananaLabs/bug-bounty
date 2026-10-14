import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

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

async function postProposal(baseUrl, body) {
  return fetch(`${baseUrl}/api/proposals`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
}

async function getProposals(baseUrl, token) {
  const response = await fetch(`${baseUrl}/api/proposals`, {
    headers: token ? { authorization: `Bearer ${token}` } : {}
  });

  return { response, payload: await response.json() };
}

test("proposal list rejects anonymous reads and scopes proposals to the authenticated participant", async () => {
  await withServer(async (baseUrl) => {
    await postProposal(baseUrl, {
      jobId: "job_scope_a",
      clientId: "usr_client_a",
      freelancerId: "usr_freelancer_a",
      coverLetter: "I can deliver this safely.",
      bidAmount: 500
    });
    await postProposal(baseUrl, {
      jobId: "job_scope_b",
      clientId: "usr_client_b",
      freelancerId: "usr_freelancer_b",
      coverLetter: "Unrelated proposal",
      bidAmount: 900
    });

    const anonymous = await getProposals(baseUrl);
    assert.equal(anonymous.response.status, 401);
    assert.deepEqual(anonymous.payload, { success: false, message: "Unauthorized" });

    const freelancerToken = signAccessToken({ sub: "usr_freelancer_a", role: "freelancer" });
    const freelancerResult = await getProposals(baseUrl, freelancerToken);
    assert.equal(freelancerResult.response.status, 200);
    assert.equal(freelancerResult.payload.success, true);
    assert.equal(freelancerResult.payload.data.length, 1);
    assert.equal(freelancerResult.payload.data[0].jobId, "job_scope_a");

    const clientToken = signAccessToken({ sub: "usr_client_a", role: "client" });
    const clientResult = await getProposals(baseUrl, clientToken);
    assert.equal(clientResult.response.status, 200);
    assert.equal(clientResult.payload.success, true);
    assert.equal(clientResult.payload.data.length, 1);
    assert.equal(clientResult.payload.data[0].jobId, "job_scope_a");
  });
});
