import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { createJob } from "../services/jobService.js";
import { createUser } from "../services/userService.js";

test("GET /api/search returns empty result groups for blank queries", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/search?q=   `);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.deepEqual(payload.data.users, []);
    assert.deepEqual(payload.data.jobs, []);
    assert.deepEqual(payload.data.freelancers, []);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("GET /api/search matches jobs and users across normalized multi-term query", async () => {
  // Pre-seed test data in in-memory services
  await createJob({
    title: "Expert Solidity Smart Contract Auditor",
    description: "Audit decentralized DeFi lending pool contracts on Ethereum",
    budgetMin: 5000,
    budgetMax: 9000,
    categoryId: "blockchain",
    skills: ["Solidity", "Foundry", "Security"]
  });

  await createUser({
    name: "Alice Blockchain Dev",
    email: "alice@web3security.io",
    role: "freelancer",
    skills: ["Solidity", "Security"]
  });

  await createUser({
    name: "Bob Client Operator",
    email: "bob@fintech.com",
    role: "client"
  });

  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    // Search with multiple terms, mixed case and extra spacing
    const response = await fetch(`http://127.0.0.1:${port}/api/search?q=  SOLIDITY   SECURITY  `);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);

    // Should find the Solidity job
    const jobMatch = payload.data.jobs.find((j) => j.title.includes("Solidity"));
    assert.ok(jobMatch, "Job matching 'Solidity Security' should be found");

    // Should find Alice in users and in freelancers
    const userMatch = payload.data.users.find((u) => u.email === "alice@web3security.io");
    assert.ok(userMatch, "Alice should be found in users");

    const freelancerMatch = payload.data.freelancers.find((f) => f.email === "alice@web3security.io");
    assert.ok(freelancerMatch, "Alice should be categorized in freelancers");

    // Bob is client without Solidity skills, should not match
    const bobMatch = payload.data.users.find((u) => u.email === "bob@fintech.com");
    assert.equal(bobMatch, undefined, "Bob should not match 'Solidity Security'");
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
