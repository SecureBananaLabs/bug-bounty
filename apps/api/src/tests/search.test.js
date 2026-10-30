import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(handler) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    return await handler(port);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("GET /api/search returns matching registered users, created users, and jobs", async () => {
  const authEmail = `node-search-${Date.now()}@example.com`;
  const apiUserEmail = `builder-${Date.now()}@example.com`;

  await withServer(async (port) => {
    await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: authEmail,
        password: "supersecret1",
        role: "freelancer"
      })
    });

    await fetch(`http://127.0.0.1:${port}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Node Builder",
        email: apiUserEmail,
        role: "client",
        skills: ["Node.js", "React"]
      })
    });

    await fetch(`http://127.0.0.1:${port}/api/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Migrate legacy API to Node.js",
        description: "Upgrade the platform to a modern Node.js stack.",
        budgetMin: 1000,
        budgetMax: 2000,
        categoryId: "cat-backend",
        skills: ["Node.js", "API"]
      })
    });

    const response = await fetch(`http://127.0.0.1:${port}/api/search?q=node`);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.data.query, "node");
    assert.match(payload.data.users.map((user) => user.email).join(","), new RegExp(authEmail));
    assert.match(payload.data.users.map((user) => user.email).join(","), new RegExp(apiUserEmail));
    assert.match(payload.data.jobs.map((job) => job.title).join(","), /Node\.js/);
    assert.equal(payload.data.freelancers.length, 1);
    assert.equal(payload.data.freelancers[0].email, authEmail);
  });
});
