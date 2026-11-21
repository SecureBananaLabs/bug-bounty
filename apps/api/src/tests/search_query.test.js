import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("Search Query Validation & Multi-Term Matching", async (t) => {
  let server;
  let baseUrl;

  t.beforeEach(async () => {
    const app = createApp();
    server = app.listen(0);
    await new Promise((res) => server.once("listening", res));
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  t.afterEach(async () => {
    if (server) {
      if (typeof server.closeAllConnections === "function") {
        server.closeAllConnections();
      }
      await new Promise((res) => server.close(res));
    }
  });

  await t.test("GET /api/search rejects query longer than 200 characters with 400", async () => {
    const longQuery = "a".repeat(201);
    const res = await fetch(`${baseUrl}/api/search?q=${longQuery}`, {
      headers: { Connection: "close" }
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.message, "Search query must not exceed 200 characters");
  });

  await t.test("GET /api/search with empty query returns empty results cleanly", async () => {
    const res = await fetch(`${baseUrl}/api/search`, {
      headers: { Connection: "close" }
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.query, "");
    assert.deepEqual(body.data.users, []);
    assert.deepEqual(body.data.jobs, []);
    assert.deepEqual(body.data.freelancers, []);
  });

  await t.test("GET /api/search matches multi-term queries across jobs and users", async () => {
    // Seed a job
    const jobRes = await fetch(`${baseUrl}/api/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Connection: "close" },
      body: JSON.stringify({
        title: "Fullstack Rust & Solidity Engineer",
        description: "Building decentralized protocol core",
        budgetMin: 5000,
        budgetMax: 10000,
        categoryId: "engineering",
        skills: ["Rust", "Solidity", "Web3"]
      })
    });
    assert.equal(jobRes.status, 201);

    // Seed a freelancer user
    const userRes = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Connection: "close" },
      body: JSON.stringify({
        name: "Rust Master",
        email: "rustacean@crypto.org",
        role: "freelancer"
      })
    });
    assert.equal(userRes.status, 201);

    // Query multi-term
    const res = await fetch(`${baseUrl}/api/search?q=Rust+Solidity`, {
      headers: { Connection: "close" }
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.data.jobs.length >= 1);
    assert.equal(body.data.jobs[0].title, "Fullstack Rust & Solidity Engineer");

    // Single term matching freelancer
    const freelancerRes = await fetch(`${baseUrl}/api/search?q=rustacean`, {
      headers: { Connection: "close" }
    });
    assert.equal(freelancerRes.status, 200);
    const freelancerBody = await freelancerRes.json();
    assert.equal(freelancerBody.success, true);
    assert.ok(freelancerBody.data.freelancers.length >= 1);
    assert.equal(freelancerBody.data.freelancers[0].role, "freelancer");
  });
});
